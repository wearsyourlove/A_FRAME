document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".hover-box").forEach(box => {
        box.addEventListener("mouseover", () => {
            box.style.opacity = "1";
        });

        box.addEventListener("mouseout", () => {
            box.style.opacity = "0";
        });
    });
});


