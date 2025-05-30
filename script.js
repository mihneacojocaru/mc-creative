document.addEventListener("DOMContentLoaded", () => {
    // LinkedIn
    const linkedin = document.getElementById("linkedin-link");
    const linkedInUrl = [
      "https://www.linkedin.com/in/",
      "mihnea-cojocaru",
      "-68821151/",
    ].join("");
    const linkedInAnchor = document.createElement("a");
    linkedInAnchor.href = linkedInUrl;
    linkedInAnchor.target = "_blank";
    linkedInAnchor.rel = "noopener noreferrer";
    linkedInAnchor.setAttribute("aria-label", linkedin.getAttribute("aria-label"));
    linkedInAnchor.setAttribute("title", linkedin.getAttribute("title"));
    linkedInAnchor.innerHTML = linkedin.innerHTML;
    linkedInAnchor.className = linkedin.className;
    linkedin.replaceWith(linkedInAnchor);

    // Mail
    const mail = document.getElementById("email-link");
    const user = "mihnea.co";
    const domain = "web.de";
    const mailAnchor = document.createElement("a");
    mailAnchor.href = `mailto:${user}@${domain}`;
    mailAnchor.setAttribute("aria-label", mail.getAttribute("aria-label"));
    mailAnchor.setAttribute("title", mail.getAttribute("title"));
    mailAnchor.innerHTML = mail.innerHTML;
    mailAnchor.className = mail.className;
    mail.replaceWith(mailAnchor);
  });