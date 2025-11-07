from flask import Flask, request
import os

app = Flask(__name__)

@app.route('/')
def index():
    return '<h1>Vulnerable App</h1><p>Use /ping?ip=... to ping an IP.</p>'

@app.route('/ping')
def ping():
    ip = request.args.get('ip')
    if ip:
        # Vulnerable to command injection
        cmd = f'ping -c 1 {ip}'
        stream = os.popen(cmd)
        output = stream.read()
        return f'<pre>{output}</pre>'
    return 'Please provide an IP address.'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8888)
