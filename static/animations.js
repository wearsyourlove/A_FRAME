document.addEventListener("DOMContentLoaded", () => {
    // 🔹 Hover Effect on Result Boxes
    document.querySelectorAll(".hover-box").forEach(box => {
        box.addEventListener("mouseover", () => {
            box.style.opacity = "1";
            box.style.transform = "scale(1.1)";
            box.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        });

        box.addEventListener("mouseout", () => {
            box.style.opacity = "0.8";
            box.style.transform = "scale(1)";
        });
    });

    // 🔹 Floating Effect for Frames
    document.querySelectorAll(".floating-box").forEach(frame => {
        frame.addEventListener("mouseover", () => {
            frame.style.transform = "scale(1.05) rotate(2deg)";
            frame.style.transition = "transform 0.3s ease-in-out";
        });

        frame.addEventListener("mouseout", () => {
            frame.style.transform = "scale(1) rotate(0deg)";
        });
    });

    // 🔹 Terminal Input Focus Animation
    const inputField = document.getElementById("command-input");
    if (inputField) {
        inputField.addEventListener("focus", () => {
            inputField.style.borderBottom = "2px solid #ffffff";
            inputField.style.transition = "border-bottom 0.3s ease-in-out";
        });

        inputField.addEventListener("blur", () => {
            inputField.style.borderBottom = "1px solid #777";
        });
    }
});
