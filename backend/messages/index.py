import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """Получение и отправка сообщений в каналах Frikords"""

    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
        'Access-Control-Max-Age': '86400',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    method = event.get('httpMethod', 'GET')
    schema = os.environ['MAIN_DB_SCHEMA']

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        channel = (params.get('channel') or 'general').replace("'", "''")

        cur.execute(
            f"""
            SELECT m.id, m.content, m.created_at, u.username, u.favorite_game
            FROM {schema}.messages m
            JOIN {schema}.users u ON u.id = m.user_id
            WHERE m.channel = '{channel}'
            ORDER BY m.created_at ASC
            LIMIT 50
            """
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        messages = [
            {
                'id': row[0],
                'content': row[1],
                'created_at': row[2].isoformat(),
                'username': row[3],
                'favorite_game': row[4] or ''
            }
            for row in rows
        ]
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'messages': messages})}

    if method == 'POST':
        token = (event.get('headers') or {}).get('X-Authorization', '').replace('Bearer ', '').strip()
        if not token:
            cur.close()
            conn.close()
            return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Необходима авторизация'})}

        body = json.loads(event.get('body') or '{}')
        content = (body.get('content') or '').strip()
        channel = (body.get('channel') or 'general').strip()

        if not content:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Сообщение не может быть пустым'})}

        cur.execute(f"SELECT user_id FROM {schema}.sessions WHERE token = '{token}'")
        row = cur.fetchone()

        if not row:
            cur.close()
            conn.close()
            return {'statusCode': 401, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Сессия не найдена, войди снова'})}

        user_id = row[0]
        safe_content = content.replace("'", "''")
        safe_channel = channel.replace("'", "''")

        cur.execute(
            f"INSERT INTO {schema}.messages (user_id, channel, content) VALUES ({user_id}, '{safe_channel}', '{safe_content}') RETURNING id, created_at"
        )
        msg_id, created_at = cur.fetchone()

        cur.execute(f"SELECT username, favorite_game FROM {schema}.users WHERE id = {user_id}")
        username, favorite_game = cur.fetchone()

        conn.commit()
        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'message': {
                    'id': msg_id,
                    'content': content,
                    'created_at': created_at.isoformat(),
                    'username': username,
                    'favorite_game': favorite_game or ''
                }
            })
        }

    cur.close()
    conn.close()
    return {'statusCode': 405, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Method not allowed'})}
