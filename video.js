document.addEventListener("DOMContentLoaded", function () {
    const themeToggle = document.getElementById("darkModeToggle");
    const bookmarkToggle = document.getElementById("bookmarkToggle");
    const body = document.body;
    const catalogToggle = document.getElementById("catalogToggle");
    const catalogDropdown = catalogToggle.nextElementSibling;

    // Проверяем сохраненную тему
    if (localStorage.getItem("theme") === "light") {
        body.classList.remove("dark-mode");
        body.classList.add("light-mode");
        themeToggle.checked = true;
    }

    // Функция для переключения темы
    function toggleTheme() {
        if (body.classList.contains("dark-mode")) {
            body.classList.remove("dark-mode");
            body.classList.add("light-mode");
            localStorage.setItem("theme", "light");
            themeToggle.checked = true;
        } else {
            body.classList.remove("light-mode");
            body.classList.add("dark-mode");
            localStorage.setItem("theme", "dark");
            themeToggle.checked = false;
        }

        // Обновляем цвет заголовков
        const hotNewsTitles = document.querySelectorAll(".hot-news-title");
        hotNewsTitles.forEach(title => {
            if (body.classList.contains("light-mode")) {
                title.style.color = "black"; // Черный цвет для светлой темы
            } else {
                title.style.color = "white"; // Белый цвет для темной темы
            }
        });
    }

    // Переключение темы при нажатии на "ЗАКЛАДКИ"
    bookmarkToggle.addEventListener("click", toggleTheme);

    // Переключение темы при нажатии на переключатель
    themeToggle.addEventListener("change", toggleTheme);

    // Открытие/закрытие панели "Каталог"
    catalogToggle.addEventListener("click", function (event) {
        event.preventDefault();
        catalogDropdown.classList.toggle("active");
    });

    // Закрытие панели при клике вне её
    document.addEventListener("click", function (event) {
        if (!catalogDropdown.contains(event.target) && event.target !== catalogToggle) {
            catalogDropdown.classList.remove("active");
        }
    });
});
document.addEventListener("DOMContentLoaded", function () {
    const carousel = document.querySelector(".carousel");
    const prevButton = document.querySelector(".prev");
    const nextButton = document.querySelector(".next");

    // Прокрутка при нажатии кнопок
    prevButton.addEventListener("click", () => {
        carousel.scrollBy({ left: -200, behavior: "smooth" });
    });

    nextButton.addEventListener("click", () => {
        carousel.scrollBy({ left: 200, behavior: "smooth" });
    });
});

const verticalCarousel = document.querySelector('.vertical-carousel');
const verticalPrevButton = document.querySelector('.vertical-prev');
const verticalNextButton = document.querySelector('.vertical-next');
let verticalIndex = 0;

verticalNextButton.addEventListener('click', () => {
    if (verticalIndex < document.querySelectorAll('.vertical-carousel .carousel-item').length - 1) {
        verticalIndex++;
        verticalCarousel.style.transform = `translateY(-${verticalIndex * 130}px)`;
    }
});

