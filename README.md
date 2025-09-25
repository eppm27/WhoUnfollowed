# 📱 Instagram Follower Analyzer

A cute and user-friendly web application to analyze your Instagram followers and find out who doesn't follow you back!

## ✨ Features

- 🎨 Beautiful Instagram-inspired UI
- 📁 Easy drag-and-drop file upload
- 📊 Visual statistics and charts
- 📥 Download results as CSV files
- 📱 Responsive design for all devices
- 🔒 Local processing (your data never leaves your device)

## 🚀 Quick Start

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Installation

1. **Clone or download this project**
   ```bash
   cd /path/to/Instagram-Follower-Analyzer
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Open your browser**
   - Go to `http://localhost:5000`
   - That's it! 🎉

## 📋 How to Get Your Instagram Data

### Step-by-Step Guide:

1. **📱 Open Instagram**
   - Use the Instagram app or visit instagram.com

2. **⚙️ Go to Settings**
   - Settings → Accounts Center → Your information & permissions

3. **💾 Request Your Data**
   - Click "Download your information"
   - Select "Some of your information"

4. **👥 Choose Data Type**
   - Select "Followers and following"
   - Format: **JSON** (important!)
   - Download to device: **Yes**

5. **📧 Wait for Email**
   - Click "Create files"
   - Wait for Instagram to email you the download link
   - This can take anywhere from a few minutes to several hours

6. **📦 Extract Files**
   - Download the ZIP file from the email
   - Extract it and look for the `followers_and_following` folder
   - You'll need:
     - `following.json` - People you follow
     - `followers_1.json` - People who follow you

## 🎯 How to Use the Analyzer

1. **Upload Files**
   - Drag and drop or click to upload your `following.json`
   - Upload your `followers_1.json` file
   - Wait for the green checkmarks ✅

2. **Analyze**
   - Click the "Analyze My Followers" button
   - Wait for the magic to happen! ✨

3. **View Results**
   - See who doesn't follow you back
   - See who you don't follow back
   - Download CSV files for further analysis

## 🛠️ Project Structure

```
Instagram-Follower-Analyzer/
├── app.py                 # Flask backend application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── check_followbacks.py  # Original command-line script
├── templates/
│   └── index.html        # Main web interface
└── static/
    ├── style.css         # Beautiful styling
    └── script.js         # Interactive functionality
```

## 🔧 Development

### Running in Development Mode
```bash
export FLASK_ENV=development  # Linux/Mac
set FLASK_ENV=development     # Windows
python app.py
```

### Customization
- **Colors**: Edit CSS variables in `static/style.css`
- **Styling**: Modify the Instagram gradient and theme colors
- **Features**: Add new analysis features in `app.py`

## 🎨 Features Highlights

### Beautiful UI
- Instagram-inspired gradient design
- Responsive layout for mobile and desktop
- Smooth animations and hover effects
- Cute icons and emojis throughout

### Smart File Handling
- Drag and drop support
- File validation and error handling
- Progress indicators
- Support for multiple Instagram export formats

### Detailed Analysis
- Visual statistics cards
- Sortable user lists
- CSV export functionality
- Clear, actionable results

### Privacy First
- All processing happens locally
- No data is sent to external servers
- Your Instagram data stays on your device

## 🐛 Troubleshooting

### Common Issues

**"No file selected" error**
- Make sure you're uploading the correct JSON files
- Check that files are not corrupted

**"Invalid JSON format" error**
- Ensure you downloaded JSON format (not HTML)
- Try re-downloading your Instagram data

**App won't start**
- Check that Python 3.7+ is installed
- Run `pip install -r requirements.txt` again
- Make sure port 5000 is not being used by another app

**Empty results**
- This might mean you follow everyone who follows you! 🎉
- Or there might be an issue with the data format

### Getting Help
If you encounter issues:
1. Check the browser console for error messages
2. Ensure your Instagram data files are in JSON format
3. Try with a fresh download of your Instagram data

## 🎉 Fun Easter Eggs

- Try the Konami code: ↑↑↓↓←→←→BA
- Hover over the instruction steps for animations
- Watch for smooth transitions and cute loading animations

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests!

---

Made with 💜 for Instagram users who want to manage their connections better!

*This tool processes your data locally and doesn't store any information.*