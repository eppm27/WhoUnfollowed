from flask import Flask, render_template, request, jsonify, send_file
import json
import csv
import io
import os

# For Vercel deployment - calculate paths relative to this file
current_dir = os.path.dirname(os.path.abspath(__file__))
template_dir = os.path.join(os.path.dirname(current_dir), 'templates')
static_dir = os.path.join(os.path.dirname(current_dir), 'static')

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def load_usernames_from_json_data(data):
    """Extract usernames from Instagram JSON data."""
    usernames = set()

    def pull_from_items(items):
        for item in items:
            sld = item.get("string_list_data") or []
            if sld and isinstance(sld, list):
                val = sld[0].get("value")
                if val:
                    usernames.add(val.strip().lstrip("@").lower())

    # Format A: top-level dict with keys like "relationships_followers"
    if isinstance(data, dict):
        for key in ("relationships_followers", "relationships_following", "followers", "following"):
            if key in data and isinstance(data[key], list):
                pull_from_items(data[key])

    # Format B: top-level list of entries with string_list_data
    if isinstance(data, list):
        pull_from_items(data)

    return usernames

def create_csv_data(usernames):
    """Create CSV data from a list of usernames."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["username"])
    for username in sorted(usernames):
        writer.writerow([username])
    return output.getvalue()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/debug')
def debug():
    import os
    return {
        'template_folder': app.template_folder,
        'static_folder': app.static_folder,
        'template_exists': os.path.exists(app.template_folder),
        'static_exists': os.path.exists(app.static_folder),
        'current_dir': os.getcwd(),
        'file_location': __file__,
        'templates_list': os.listdir(app.template_folder) if os.path.exists(app.template_folder) else 'Not found',
        'static_list': os.listdir(app.static_folder) if os.path.exists(app.static_folder) else 'Not found'
    }

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        # Check if files are present
        if 'following' not in request.files or 'followers' not in request.files:
            return jsonify({'error': 'Both following.json and followers.json files are required'}), 400
        
        following_file = request.files['following']
        followers_file = request.files['followers']
        
        if following_file.filename == '' or followers_file.filename == '':
            return jsonify({'error': 'Please select both files'}), 400
        
        # Load and parse JSON data
        try:
            following_data = json.load(following_file)
            followers_data = json.load(followers_file)
        except json.JSONDecodeError as e:
            return jsonify({'error': f'Invalid JSON format: {str(e)}'}), 400
        
        # Extract usernames
        following = load_usernames_from_json_data(following_data)
        followers = load_usernames_from_json_data(followers_data)
        
        # Calculate differences
        not_following_back = following - followers
        i_dont_follow_back = followers - following
        
        # Prepare results
        results = {
            'following_count': len(following),
            'followers_count': len(followers),
            'not_following_back': {
                'count': len(not_following_back),
                'users': sorted(list(not_following_back))
            },
            'i_dont_follow_back': {
                'count': len(i_dont_follow_back),
                'users': sorted(list(i_dont_follow_back))
            }
        }
        
        return jsonify(results)
        
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500

@app.route('/download/<list_type>')
def download_csv(list_type):
    try:
        # Get the data from the session or re-process (simplified for demo)
        # In a production app, you'd want to store this data temporarily
        return jsonify({'error': 'Please analyze your data first'}), 400
    except Exception as e:
        return jsonify({'error': f'Download failed: {str(e)}'}), 500

@app.route('/download_csv', methods=['POST'])
def download_csv_data():
    try:
        data = request.get_json()
        list_type = data.get('type')
        usernames = data.get('usernames', [])
        
        if not list_type or not usernames:
            return jsonify({'error': 'Invalid data'}), 400
        
        # Create CSV content
        csv_content = create_csv_data(usernames)
        
        # Create a file-like object
        csv_file = io.BytesIO()
        csv_file.write(csv_content.encode('utf-8'))
        csv_file.seek(0)
        
        filename = f"{list_type}.csv"
        
        return send_file(
            csv_file,
            as_attachment=True,
            download_name=filename,
            mimetype='text/csv'
        )
        
    except Exception as e:
        return jsonify({'error': f'Download failed: {str(e)}'}), 500

# For local testing
if __name__ == '__main__':
    app.run(debug=True)

# For Vercel deployment - the app variable is automatically detected