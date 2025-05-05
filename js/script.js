$(document).ready(function() {
    // Hàm lấy dữ liệu từ localStorage
    function getMatches() {
        const today = new Date().toISOString().split('T')[0];
        return JSON.parse(localStorage.getItem(`matches_${today}`)) || [];
    }

    // Hàm lưu dữ liệu vào localStorage
    function saveMatches(matches) {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`matches_${today}`, JSON.stringify(matches));
    }

    // Hàm hiển thị danh sách trận đấu
    function displayMatches(matches = null) {
        const matchList = $('#matchList');
        matchList.empty();

        const matchesToDisplay = matches || getMatches();

        matchesToDisplay.forEach((match, index) => {
            const matchTime = new Date(match.time).toLocaleString('vi-VN');
            const matchHtml = `
                <div class="match-item">
                    <h4>${match.team1} vs ${match.team2}</h4>
                    <p><strong>Thời gian:</strong> ${matchTime}</p>
                    <div class="player-list">
                        <p><strong>Đội 1:</strong> ${match.team1Players.join(', ')}</p>
                        <p><strong>Đội 2:</strong> ${match.team2Players.join(', ')}</p>
                    </div>
                    <div class="btn-group mt-2">
                        <button class="btn btn-primary btn-sm" onclick="editMatch(${index})">
                            <i class="fas fa-edit"></i> Chỉnh sửa
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteMatch(${index})">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </div>
                </div>
            `;
            matchList.append(matchHtml);
        });
    }

    // Xử lý form submit
    $('#matchForm').on('submit', function(e) {
        e.preventDefault();

        // Lấy dữ liệu từ form
        const team1Name = $('#team1Name').val();
        const team2Name = $('#team2Name').val();
        const matchTime = $('#matchTime').val();

        // Lấy danh sách người chơi
        const team1Players = [];
        const team2Players = [];
        
        $('#team1Players input').each(function() {
            team1Players.push($(this).val());
        });

        $('#team2Players input').each(function() {
            team2Players.push($(this).val());
        });

        // Tạo đối tượng trận đấu mới
        const newMatch = {
            team1: team1Name,
            team2: team2Name,
            time: matchTime,
            team1Players: team1Players,
            team2Players: team2Players
        };

        // Lưu trận đấu mới
        const matches = getMatches();
        matches.push(newMatch);
        saveMatches(matches);

        // Hiển thị lại danh sách
        displayMatches();

        // Reset form
        this.reset();

        // Hiển thị thông báo
        showNotification('Tạo trận đấu thành công!', 'success');
    });

    // Hàm xóa trận đấu
    window.deleteMatch = function(index) {
        if (confirm('Bạn có chắc muốn xóa trận đấu này?')) {
            const matches = getMatches();
            matches.splice(index, 1);
            saveMatches(matches);
            displayMatches();
            showNotification('Đã xóa trận đấu!', 'success');
        }
    };

    // Hàm chỉnh sửa trận đấu
    window.editMatch = function(index) {
        const matches = getMatches();
        const match = matches[index];

        // Điền dữ liệu vào form chỉnh sửa
        $('#editMatchIndex').val(index);
        $('#editTeam1Name').val(match.team1);
        $('#editTeam2Name').val(match.team2);
        $('#editMatchTime').val(match.time);

        // Tạo input cho người chơi đội 1
        const team1PlayersHtml = match.team1Players.map(player => `
            <div class="input-group mb-2">
                <span class="input-group-text"><i class="fas fa-user"></i></span>
                <input type="text" class="form-control" value="${player}" required>
            </div>
        `).join('');
        $('#editTeam1Players').html(team1PlayersHtml);

        // Tạo input cho người chơi đội 2
        const team2PlayersHtml = match.team2Players.map(player => `
            <div class="input-group mb-2">
                <span class="input-group-text"><i class="fas fa-user"></i></span>
                <input type="text" class="form-control" value="${player}" required>
            </div>
        `).join('');
        $('#editTeam2Players').html(team2PlayersHtml);

        // Hiển thị modal
        $('#editMatchModal').modal('show');
    };

    // Xử lý lưu chỉnh sửa
    $('#saveEditMatch').on('click', function() {
        const index = $('#editMatchIndex').val();
        const matches = getMatches();

        // Lấy dữ liệu từ form chỉnh sửa
        const team1Name = $('#editTeam1Name').val();
        const team2Name = $('#editTeam2Name').val();
        const matchTime = $('#editMatchTime').val();

        // Lấy danh sách người chơi
        const team1Players = [];
        const team2Players = [];
        
        $('#editTeam1Players input').each(function() {
            team1Players.push($(this).val());
        });

        $('#editTeam2Players input').each(function() {
            team2Players.push($(this).val());
        });

        // Cập nhật trận đấu
        matches[index] = {
            team1: team1Name,
            team2: team2Name,
            time: matchTime,
            team1Players: team1Players,
            team2Players: team2Players
        };

        // Lưu và hiển thị lại
        saveMatches(matches);
        displayMatches();

        // Đóng modal
        $('#editMatchModal').modal('hide');

        // Hiển thị thông báo
        showNotification('Cập nhật trận đấu thành công!', 'success');
    });

    // Xử lý tìm kiếm
    $('#searchMatch').on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        const matches = getMatches();

        const filteredMatches = matches.filter(match => {
            return match.team1.toLowerCase().includes(searchTerm) ||
                   match.team2.toLowerCase().includes(searchTerm) ||
                   match.team1Players.some(player => player.toLowerCase().includes(searchTerm)) ||
                   match.team2Players.some(player => player.toLowerCase().includes(searchTerm));
        });

        displayMatches(filteredMatches);
    });

    // Hàm hiển thị thông báo
    function showNotification(message, type = 'success') {
        const notification = $(`
            <div class="notification ${type}">
                ${message}
            </div>
        `);

        $('body').append(notification);

        setTimeout(() => {
            notification.fadeOut(() => notification.remove());
        }, 3000);
    }

    // Hiển thị danh sách trận đấu khi trang được tải
    displayMatches();
}); 