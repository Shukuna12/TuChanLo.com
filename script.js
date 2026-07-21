document.addEventListener('DOMContentLoaded', () => {

    // 1. Đồng bộ thanh điều hướng khi click chuyển mục
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(el => el.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 2. Click chọn cảm xúc (Mood tracker)
    const moodButtons = document.querySelectorAll('.mood-btn');
    moodButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            moodButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const emotion = this.querySelector('span').innerText;
            console.log(`Tâm trạng hiện tại: ${emotion}`);
        });
    });

    // 3. Click nhắc nhở uống nước
    const waterBtn = document.getElementById('waterBtn');
    if (waterBtn) {
        waterBtn.addEventListener('click', function() {
            this.innerHTML = "<i class='fa-solid fa-check-double'></i> Đã hoàn thành!";
            this.classList.add('success');
        });
    }

    // 4. Xử lý gửi Form Add Task (Chặn load trang giả lập)
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Đã thêm task mới thành công! (Giả lập hệ thống)');
            this.reset();
        });
    }

    // 5. Xử lý gửi Form liên hệ (Contact Form)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Cảm ơn đóng góp của bạn! Lời nhắn đã được gửi đi.');
            this.reset();
        });
    }
});