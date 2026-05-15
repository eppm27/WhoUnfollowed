// Instagram Insights - JavaScript functionality
document.addEventListener("DOMContentLoaded", function () {
  // Get DOM elements
  const followingFile = document.getElementById("following-file");
  const followersFile = document.getElementById("followers-file");
  const followingStatus = document.getElementById("following-status");
  const followersStatus = document.getElementById("followers-status");
  const followingUpload = document.getElementById("following-upload");
  const followersUpload = document.getElementById("followers-upload");
  const analyzeBtn = document.getElementById("analyze-btn");
  const loadingSection = document.getElementById("loading-section");
  const resultsSection = document.getElementById("results-section");

  // File validation
  function validateJSONFile(file) {
    if (!file) return { valid: false, message: "No file selected" };

    if (!file.name.toLowerCase().endsWith(".json")) {
      return { valid: false, message: "Please select a JSON file" };
    }

    if (file.size > 16 * 1024 * 1024) {
      return { valid: false, message: "File too large (max 16MB)" };
    }

    return { valid: true, message: "File looks good!" };
  }

  // Update file status
  function updateFileStatus(statusElement, uploadElement, validation, fileName) {
    if (validation.valid) {
      statusElement.innerHTML = `<i class="fas fa-check-circle"></i> ${fileName}`;
      statusElement.className = "file-status success";
      uploadElement.closest(".upload-card")?.classList.add("file-uploaded");
    } else {
      statusElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${validation.message}`;
      statusElement.className = "file-status error";
      uploadElement.closest(".upload-card")?.classList.remove("file-uploaded");
    }
    checkAnalyzeButton();
  }

  // Check if analyze button should be enabled
  function checkAnalyzeButton() {
    const followingValid =
      followingFile.files.length > 0 && validateJSONFile(followingFile.files[0]).valid;
    const followersValid =
      followersFile.files.length > 0 && validateJSONFile(followersFile.files[0]).valid;

    analyzeBtn.disabled = !(followingValid && followersValid);
  }

  // File input handlers
  followingFile.addEventListener("change", function () {
    const file = this.files[0];
    const validation = validateJSONFile(file);
    updateFileStatus(followingStatus, followingUpload, validation, file ? file.name : "");
  });

  followersFile.addEventListener("change", function () {
    const file = this.files[0];
    const validation = validateJSONFile(file);
    updateFileStatus(followersStatus, followersUpload, validation, file ? file.name : "");
  });

  // Drag and drop functionality
  function setupDragAndDrop(uploadElement, fileInput) {
    uploadElement.addEventListener("dragover", function (e) {
      e.preventDefault();
      const card = this.closest(".upload-card");
      if (card) card.classList.add("drag-over");
    });

    uploadElement.addEventListener("dragleave", function (e) {
      e.preventDefault();
      const card = this.closest(".upload-card");
      if (card) card.classList.remove("drag-over");
    });

    uploadElement.addEventListener("drop", function (e) {
      e.preventDefault();
      const card = this.closest(".upload-card");
      if (card) card.classList.remove("drag-over");

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        fileInput.dispatchEvent(new Event("change"));
      }
    });
  }

  setupDragAndDrop(followingUpload, followingFile);
  setupDragAndDrop(followersUpload, followersFile);

  // Analyze button handler
  analyzeBtn.addEventListener("click", async function () {
    if (this.disabled) return;

    try {
      // Show loading
      loadingSection.style.display = "block";
      resultsSection.style.display = "none";
      this.disabled = true;
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';

      // Prepare form data
      const formData = new FormData();
      formData.append("following", followingFile.files[0]);
      formData.append("followers", followersFile.files[0]);

      // Send request
      const response = await fetch("/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      // Display results
      displayResults(data);
    } catch (error) {
      console.error("Analysis error:", error);
      alert(`Analysis failed: ${error.message}`);
    } finally {
      // Hide loading
      loadingSection.style.display = "none";
      this.disabled = false;
      this.innerHTML = '<i class="fas fa-sparkles"></i> Analyze My Lists';
    }
  });

  // Display results function
  function displayResults(data) {
    // Update stats
    document.getElementById("following-count").textContent = data.following_count.toLocaleString();
    document.getElementById("followers-count").textContent = data.followers_count.toLocaleString();
    document.getElementById("not-following-back-count").textContent = data.not_following_back.count.toLocaleString();
    document.getElementById("i-dont-follow-back-count").textContent = data.i_dont_follow_back.count.toLocaleString();

    // Update count labels
    const notFollowingBackCount = data.not_following_back.count;
    const iDontFollowBackCount = data.i_dont_follow_back.count;
    
    document.getElementById("not-following-back-count-label").textContent = 
      `${notFollowingBackCount} ${notFollowingBackCount === 1 ? 'user' : 'users'}`;
    document.getElementById("i-dont-follow-back-count-label").textContent = 
      `${iDontFollowBackCount} ${iDontFollowBackCount === 1 ? 'user' : 'users'}`;

    // Display user lists
    displayUserList("not-following-back-list", data.not_following_back.users);
    displayUserList("i-dont-follow-back-list", data.i_dont_follow_back.users);

    // Setup download buttons
    setupDownloadButton("download-not-following", "not_following_back", data.not_following_back.users);
    setupDownloadButton("download-i-dont-follow", "i_dont_follow_back", data.i_dont_follow_back.users);

    // Show results
    resultsSection.style.display = "block";
    resultsSection.scrollIntoView({ behavior: "smooth" });
  }

  // Display user list
  function displayUserList(elementId, users) {
    const listElement = document.getElementById(elementId);

    if (users.length === 0) {
      listElement.innerHTML =
        '<div class="user-item" style="text-align: center; color: var(--text-muted); font-style: italic;">No users — great job! 🎉</div>';
      return;
    }

    listElement.innerHTML = users.map((user) => `<div class="user-item">@${user}</div>`).join("");
  }

  // Setup download button
  function setupDownloadButton(buttonId, type, users) {
    const button = document.getElementById(buttonId);

    button.onclick = async function () {
      try {
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';
        this.disabled = true;

        const response = await fetch("/download_csv", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: type,
            usernames: users,
          }),
        });

        if (!response.ok) {
          throw new Error("Download failed");
        }

        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Show success message
        this.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
        setTimeout(() => {
          this.innerHTML = '<i class="fas fa-download"></i> Download List';
        }, 2000);
      } catch (error) {
        console.error("Download error:", error);
        alert("Download failed. Please try again.");
        this.innerHTML = '<i class="fas fa-download"></i> Download List';
      } finally {
        this.disabled = false;
      }
    };
  }

  console.log("✨ Instagram Insights loaded successfully!");
  console.log("💡 All processing happens locally in your browser — nothing is uploaded.");
});

