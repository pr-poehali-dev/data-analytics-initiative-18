import json
import os
import hashlib
import secrets
import psycopg2

def handler(event: dict, context) -> dict:
    """Вход пользователя в Frikords — возвращает токен сессии"""

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
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''

    if not email or not password:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Введи email и пароль'})
        }

    password_hash = hashlib.sha256(password.encode()).hexdigest()
    schema = os.environ['MAIN_DB_SCHEMA']

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute(
        f"SELECT id, username, favorite_game FROM {schema}.users WHERE email = '{email}' AND password_hash = '{password_hash}'"
    )
    row = cur.fetchone()

    if not row:
        cur.close()
        conn.close()
        return {
            'statusCode': 401,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Неверный email или пароль'})
        }

    user_id, username, favorite_game = row
    token = secrets.token_hex(32)

    cur.execute(
        f"INSERT INTO {schema}.sessions (user_id, token) VALUES ({user_id}, '{token}')"
    )
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'token': token,
            'user': {
                'id': user_id,
                'username': username,
                'favorite_game': favorite_game or ''
            }
        })
    }
