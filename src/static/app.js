document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    activitiesList.innerHTML = '<p>Loading activities...</p>';
    try {
      const response = await fetch("/activities");
      if (!response.ok) throw new Error("Failed to load");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      renderActivities(activities);
      populateSelect(activities);
    } catch (error) {
      activitiesList.innerHTML = '<p style="color:#b91c1c">Unable to load activities.</p>';
      console.error("Error fetching activities:", error);
    }
  }

  function renderActivities(activities) {
    activitiesList.innerHTML = "";
    Object.entries(activities).forEach(([name, info]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      // attach the activity name for delegated event handlers
      activityCard.dataset.activity = name;
      const participantsHtml = renderParticipants(info.participants);
      activityCard.innerHTML = `
        <div class="card-header">
          <div class="title">${escapeHtml(name)}</div>
          <div class="meta">${escapeHtml(info.schedule || "")}</div>
        </div>
        <div class="desc">${escapeHtml(info.description || "")}</div>
        <div class="participants-wrap">
          <strong>Participants</strong>
          ${participantsHtml}
        </div>
        <div class="card-footer"><span class="small">Max: ${info.max_participants}</span></div>
      `;
      activitiesList.appendChild(activityCard);
    });
  }

  function renderParticipants(list) {
    if (!Array.isArray(list) || list.length === 0) {
      return `<p class="participants-empty">No participants yet.</p>`;
    }
    const items = list
      .map(
        (e) =>
          `<li class="participant-item" data-email="${escapeHtml(e)}"><span class="participant-email">${escapeHtml(
            e
          )}</span><button class="delete-btn" title="Remove participant" aria-label="Remove participant">🗑️</button></li>`
      )
      .join("");
    return `<ul class="participants">${items}</ul>`;
  }

  // Delegated click handler for delete buttons
  activitiesList.addEventListener("click", async (event) => {
    const btn = event.target.closest(".delete-btn");
    if (!btn) return;
    const li = btn.closest(".participant-item");
    if (!li) return;
    const email = li.dataset.email;
    const card = li.closest(".activity-card");
    if (!card) return;
    const activity = card.dataset.activity;
    if (!email || !activity) return;

    // confirm removal
    if (!confirm(`Remove ${email} from ${activity}?`)) return;

    try {
      const url = `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`;
      const resp = await fetch(url, { method: "DELETE" });
      const body = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(body.detail || body.message || "Failed to remove participant");
      // remove list item from DOM
      li.remove();
      // if no participants remain, show empty message by refreshing activities
      // (keeps UI consistent with server state)
      await fetchActivities();
    } catch (err) {
      alert(err.message || "Could not remove participant");
      console.error(err);
    }
  });

  function populateSelect(activities) {
    // clear existing options except the placeholder
    while (activitySelect.options.length > 1) activitySelect.remove(1);
    Object.keys(activities).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.text = name;
      activitySelect.add(opt);
    });
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    messageDiv.className = "";
    messageDiv.textContent = "";
    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;
    if (!email || !activity) {
      messageDiv.className = "error";
      messageDiv.textContent = "Please provide an email and choose an activity.";
      return;
    }
    try {
      const url = `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`;
      const response = await fetch(url, { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.detail || body.message || "Signup failed");
      messageDiv.className = "success";
      messageDiv.textContent = body.message || "Signed up successfully.";
      // refresh list and select counts
      await fetchActivities();
      signupForm.reset();
    } catch (error) {
      messageDiv.className = "error";
      messageDiv.textContent = error.message || "Signup error";
      console.error(error);
    }
  });

  // simple escaper
  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // Initialize app
  fetchActivities();
});
