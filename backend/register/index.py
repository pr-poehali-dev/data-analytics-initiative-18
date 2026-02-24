import json
import os
import re
import bcrypt
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
}

def log_error(cur, schema, source, message, details=None, ip=None, user_id=None):
    safe_msg = message.replace("'", "''")
    safe_det = (details or '').replace("'", "''")
    cur.execute(
        f"INSERT INTO {schema}.error_logs (level, source, message, details, ip, user_id) "
        f"VALUES ('error', '{source}', '{safe_msg}', '{safe_det}', '{ip or ''}', {user_id or 'NULL'})"
    )

def check_rate_limit(cur, schema, key, limit=5, window_sec=60):
    cur.execute(f"SELECT count, window_start FROM {schema}.rate_limits WHERE key = '{key}'")
    row = cur.fetchone()
    if row:
        count, window_start = row
        cur.execute(f"SELECT EXTRACT(EPOCH FROM (now() - '{window_start}'::timestamp))")
        elapsed = cur.fetchone()[0]
        if elapsed > window_sec:
            cur.execute(f"UPDATE {schema}.rate_limits SET count = 1, window_start = now() WHERE key = '{key}'")
            return False
        if count >= limit:
            return True
        cur.execute(f"UPDATE {schema}.rate_limits SET count = count + 1 WHERE key = '{key}'")
    else:
        cur.execute(f"INSERT INTO {schema}.rate_limits (key, count, window_start) VALUES ('{key}', 1, now()) ON CONFLICT (key) DO UPDATE SET count = rate_limits.count + 1")
    return False

def sanitize(value: str) -> str:
    value = re.sub(r'[<>"\']', '', value)
    return value.strip()

def handler(event: dict, context) -> dict:
    """Регистрация нового пользователя в Frikords (bcrypt, защита от инъекций)"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    ip = (event.get('requestContext') or {}).get('identity', {}).get('sourceIp', 'unknown')
    body = json.loads(event.get('body') or '{}')
    username = sanitize(body.get('username') or '')
    email = sanitize(body.get('email') or '').lower()
    password = body.get('password') or ''
    favorite_game = sanitize(body.get('favorite_game') or '')

    if not username or not email or not password:
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Заполните все обязательные поля'})}

    if len(username) < 2 or len(username) > 32:
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Никнейм: от 2 до 32 символов'})}

    if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Некорректный email'})}

    if len(password) < 8:
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Пароль должен быть не менее 8 символов'})}

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    schema = os.environ['MAIN_DB_SCHEMA']
    safe_user = username.replace("'", "''")
    safe_email = email.replace("'", "''")
    safe_game = favorite_game.replace("'", "''")

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if check_rate_limit(cur, schema, f'register:{ip}', limit=5, window_sec=300):
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 429, 'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Слишком много попыток. Подожди 5 минут.'})}

    cur.execute(f"SELECT id FROM {schema}.users WHERE email = '{safe_email}' OR username = '{safe_user}'")
    if cur.fetchone():
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 409, 'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Пользователь с таким email или никнеймом уже существует'})}

    cur.execute(
        f"INSERT INTO {schema}.users (username, email, password_hash, favorite_game) "
        f"VALUES ('{safe_user}', '{safe_email}', '{password_hash}', '{safe_game}') RETURNING id"
    )
    user_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'user': {'id': user_id, 'username': username, 'email': email}})}
