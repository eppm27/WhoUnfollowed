# 📱 Instagram Follower Analyzer

A cute and user-friendly web application to analyze your Instagram followers and find out who doesn't follow you back! Deployed on Vercel for easy access.

## ✨ Features

- 🎨 Beautiful Instagram-inspired UI with custom favicon
- 📁 Easy drag-and-drop file upload
- 📊 Visual statistics and charts
- 📥 Download results as CSV files
- 📱 Responsive design for all devices
- 🔒 Privacy-first (your data is processed securely)
- ☁️ Cloud deployment ready (Vercel)
- 🚀 Fast serverless architecture

## 🚀 Quick Start

### Live Demo

Visit the live application: (https://who-unfollowed.vercel.app/)

### Local Development

#### Prerequisites

- Python 3.9 or higher
- pip (Python package manager)

#### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/eppm27/WhoUnfollowed.git
   cd WhoUnfollowed
   ```

2. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Run locally**

   ```bash
   # Option 1: Run the main app
   python app.py

   # Option 2: Run the API directly
   cd api && python index.py
   ```

4. **Open your browser**
   - Go to `http://localhost:5000`
   - That's it! 🎉

### Deploy to Vercel

1. **Fork this repository**
2. **Connect to Vercel**
3. **Deploy automatically** - Vercel will detect the configuration
4. **Access your live app** at your Vercel URL

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
WhoUnfollowed/
├── api/
│   └── index.py          # Vercel serverless API endpoint
├── templates/
│   └── index.html        # Main web interface with Instagram favicon
├── static/
│   ├── style.css         # Beautiful Instagram-inspired styling
│   └── script.js         # Interactive functionality
├── app.py                # Local development Flask app
├── requirements.txt      # Python dependencies
├── runtime.txt           # Python version for Vercel
├── vercel.json           # Vercel deployment configuration
├── start.sh              # Startup script
├── .gitignore            # Git ignore patterns
└── README.md             # This documentation
```

## 🔧 Development

### Architecture

This project uses a **dual structure** for maximum flexibility:

- **`app.py`**: Traditional Flask app for local development
- **`api/index.py`**: Serverless function for Vercel deployment
- **Shared**: Templates and static files are shared between both

### Running in Development Mode

```bash
# Traditional Flask development
export FLASK_ENV=development  # Linux/Mac
set FLASK_ENV=development     # Windows
python app.py

# Or test the Vercel API structure locally
cd api && python index.py
```

### Testing Vercel Deployment Locally

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally with Vercel
vercel dev
```

### Customization

- **Colors**: Edit CSS variables in `static/style.css`
- **Styling**: Modify the Instagram gradient and theme colors
- **API Logic**: Update analysis features in `api/index.py`
- **Local Logic**: Update features in `app.py` for local development
- **UI**: Modify templates and static files (shared by both)

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

### Privacy & Security

- **Secure processing**: Your data is processed safely in the cloud
- **No storage**: Files are processed in memory and not stored
- **HTTPS encryption**: All data transfer is encrypted
- **No tracking**: We don't collect or store personal information

### Technical Features

- **Serverless Architecture**: Powered by Vercel for fast, scalable deployment
- **Dual Flask Structure**: Traditional Flask + Serverless API compatibility
- **Instagram Branding**: Custom favicon and Instagram-inspired design
- **Error Handling**: Comprehensive error handling and user feedback
- **File Validation**: Smart JSON parsing with multiple format support
- **Responsive Design**: Works perfectly on mobile and desktop

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

## � Deployment Status

- ✅ **Vercel Ready**: Optimized for serverless deployment
- ✅ **Local Development**: Works perfectly in local environment
- ✅ **Mobile Responsive**: Tested on all device sizes
- ✅ **Instagram Branding**: Custom favicon and brand colors
- ✅ **Error Handling**: Comprehensive error management
- ✅ **File Processing**: Supports multiple Instagram export formats

## �📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests!

### Repository

- **GitHub**: [github.com/eppm27/WhoUnfollowed](https://github.com/eppm27/WhoUnfollowed)
- **Live Demo**: [Your Vercel URL]

---

Made with 💜 for Instagram users who want to manage their connections better!

_This tool processes your data securely and doesn't store any personal information._
