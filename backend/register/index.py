import json
import os
import hashlib
import psycopg2

def handler(event: dict, context) -> dict:
    """Регистрация нового пользователя в Frikords"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': ''
        }

    body = json.loads(event.get('body') or '{}')
    username = (body.get('username') or '').strip()
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''
    favorite_game = (body.get('favorite_game') or '').strip()

    if not username or not email or not password:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Заполните все обязательные поля'})
        }

    if len(password) < 8:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Пароль должен быть не менее 8 символов'})
        }

    password_hash = hashlib.sha256(password.encode()).hexdigest()
    schema = os.environ['MAIN_DB_SCHEMA']

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute(
        f"SELECT id FROM {schema}.users WHERE email = '{email}' OR username = '{username}'"
    )
    existing = cur.fetchone()

    if existing:
        cur.close()
        conn.close()
        return {
            'statusCode': 409,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Пользователь с таким email или никнеймом уже существует'})
        }

    cur.execute(
        f"INSERT INTO {schema}.users (username, email, password_hash, favorite_game) "
        f"VALUES ('{username}', '{email}', '{password_hash}', '{favorite_game}') RETURNING id"
    )
    user_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'user': {'id': user_id, 'username': username, 'email': email}
        })
    }
