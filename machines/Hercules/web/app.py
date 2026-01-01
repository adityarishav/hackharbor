from flask import Flask, request, render_template_string, session, redirect
import ldap
import html 
import os

app = Flask(__name__)
app.secret_key = "B26C371EA0A71FA5C3C9AB53A343E9B962CD947CD3EB5861EDAE4CCC6B019581"

# LDAP CONFIG
LDAP_SERVER = "ldap://127.0.0.1"
BIND_USER = "cn=admin,dc=hercules,dc=htb"
BIND_PASS = "Prettyprincess123!" 
BASE_DN = "ou=users,dc=hercules,dc=htb"


HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Hercules Corporate Portal</title>
    <style>
        body {
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            height: 100vh;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            width: 350px;
            text-align: center;
        }
        h2 { margin-bottom: 20px; letter-spacing: 2px; }
        input {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border: none;
            border-radius: 5px;
            background: rgba(0, 0, 0, 0.3);
            color: white;
            outline: none;
            box-sizing: border-box; /* Fix padding issue */
        }
        input::placeholder { color: #ccc; }
        input[type="submit"] {
            background: #4facfe;
            background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
            color: white;
            cursor: pointer;
            font-weight: bold;
            transition: transform 0.2s;
        }
        input[type="submit"]:hover { transform: scale(1.05); }
        .error { color: #ff6b6b; margin-top: 10px; font-size: 0.9em; }
        .dashboard { text-align: left; }
        .btn {
            display: inline-block;
            padding: 8px 15px;
            margin-top: 10px;
            background: rgba(255,255,255,0.2);
            text-decoration: none;
            color: white;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        {% if user %}
            <div class="dashboard">
                <h2>Access Granted</h2>
                <p><strong>User:</strong> {{ user }}</p>
                <p><strong>Role:</strong> <span style="color: #4facfe">{{ role }}</span></p>
                <hr style="border-color: rgba(255,255,255,0.1)">
                <p>Welcome to the intranet.</p>
                <a href="/download?file=app.py" class="btn">Download Source</a>
                {% if role == 'web_admin' %}
                    <br><br>
                    <a href="/upload" class="btn" style="background: #ff6b6b">Admin Panel</a>
                {% endif %}
                <br><br>
                <a href="/logout" style="color: #aaa; font-size: 0.8em">Logout</a>
            </div>
        {% else %}
            <h2>HERCULES<br><small style="font-size:0.5em; opacity:0.7">LOGIN PORTAL</small></h2>
            <form method="POST" action="/login">
                <input type="text" name="username" placeholder="Username" required>
                <input type="password" name="password" placeholder="Password" required>
                <input type="submit" value="AUTHENTICATE">
            </form>
            {% if error %}
                <div class="error">{{ error }}</div>
            {% endif %}
        {% endif %}
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    if 'user' in session:
        return render_template_string(HTML_TEMPLATE, user=session['user'], role=session.get('role', 'user'))
    return redirect('/login')

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password') 

        try:
            # 1. Connect to LDAP
            l = ldap.initialize(LDAP_SERVER)
            
            # 2. Bind as Admin 
            try:
                l.simple_bind_s(BIND_USER, BIND_PASS)
            except ldap.INVALID_CREDENTIALS:
                return render_template_string(HTML_TEMPLATE, error="Server Config Error: Admin Bind Failed (Check setup.sh)")

            # 3. VULNERABILITY: LDAP Injection
            # If user types '*', filter becomes (cn=*)
            search_filter = f"(cn={username})"
            result = l.search_s(BASE_DN, ldap.SCOPE_SUBTREE, search_filter)
            
            if result:
                # Login Success
                found_user = result[0][1]['cn'][0].decode('utf-8')
                session['user'] = found_user
                session['role'] = 'guest'
                return redirect('/')
            else:
                error = "Invalid Credentials"
        except Exception as e:
            error = f"LDAP Error: {str(e)}"
            
    return render_template_string(HTML_TEMPLATE, error=error)

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

# VULNERABILITY: LFI
@app.route('/download')
def download():
    filename = request.args.get('file')
    try:
        with open(filename, 'r') as f:
            content = f.read()
            return f"<pre style='color:white; background:black; padding:20px'>{html.escape(content)}</pre>"
    except Exception as e:
        return str(e)
# VULNERABILITY: RCE
@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if session.get('role') != 'web_admin':
        return "ACCESS DENIED"
    
    output = ""
    if request.method == 'POST':
        cmd = request.form.get('cmd')
        output = os.popen(cmd).read()
        
    return f'''
    <body style="background:black; color:#0f0; font-family:monospace; padding:50px">
        <h1>COMMAND CONSOLE</h1>
        <form method="POST">
            <input type="text" name="cmd" style="width:80%; padding:10px; background:#333; color:white; border:none" autofocus placeholder="Enter command...">
            <input type="submit" value="RUN" style="padding:10px;">
        </form>
        <pre>{output}</pre>
    </body>
    '''

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)