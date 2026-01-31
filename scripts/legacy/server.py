#!/usr/bin/env python3
"""
Simple HTTP server to provide evaluation data to bookmarklet
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sqlite3
from database import DB_PATH
from urllib.parse import urlparse


class ScoutHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse URL
        path = urlparse(self.path).path

        # CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        if path.startswith('/check/'):
            # Get item ID from path
            item_id = path.split('/check/')[1]

            # Query database
            try:
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()

                c.execute('''
                    SELECT evaluated, flip_score, weirdness_score, scam_likelihood, notes
                    FROM listings
                    WHERE listing_url LIKE ?
                ''', (f'%{item_id}%',))

                result = c.fetchone()
                conn.close()

                if result:
                    response = {
                        'evaluated': bool(result[0]),
                        'flip': result[1] or 0,
                        'weird': result[2] or 0,
                        'scam': result[3] or 0,
                        'notes': result[4] or ''
                    }
                else:
                    response = {'evaluated': False}

                self.wfile.write(json.dumps(response).encode())
            except Exception as e:
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            self.wfile.write(json.dumps({'status': 'Scout server running'}).encode())

    def log_message(self, format, *args):
        # Suppress log messages
        pass


def run_server(port=8765):
    server_address = ('', port)
    httpd = HTTPServer(server_address, ScoutHandler)
    print(f"🌐 Scout server running on http://localhost:{port}")
    print("📋 Bookmarklet can now query evaluations")
    print("⌨️  Press Ctrl+C to stop\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped")


if __name__ == '__main__':
    run_server()
