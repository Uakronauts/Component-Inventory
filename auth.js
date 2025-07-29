var token = "";
var firstLoad = true;

function decodeJWT(token) {

    let base64Url = token.split(".")[1];
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    let jsonPayload = decodeURIComponent(
        atob(base64)
        .split("")
        .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
}

function handleCredentialResponse(response) {

    // console.log("Encoded JWT ID token: " + response.credential);
    console.log("JWT Token Acquired.")

    const responsePayload = decodeJWT(response.credential);
    token = response.credential;

    
    clearTimeout(signinTimeout);
    document.getElementById("signin-container").style.display = "none";

    // console.log("Decoded JWT ID token fields:");
    // console.log("  Full Name: " + responsePayload.name);
    // console.log("  Given Name: " + responsePayload.given_name);
    // console.log("  Family Name: " + responsePayload.family_name);
    // console.log("  Unique ID: " + responsePayload.sub);
    // console.log("  Profile image URL: " + responsePayload.picture);
    // console.log("  Email: " + responsePayload.email);
    if (firstLoad == true){
        firstLoad = false;
        fetchAndDisplayParts();
    }
}



let signinTimeout = setTimeout(() => {
  if (!token) {
    document.getElementById("signin-container").style.display = "block"; // or "manual-signin"
  }
}, 5000);