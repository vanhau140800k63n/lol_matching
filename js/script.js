$(document).ready(function() {
    const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN'; // Thay thế bằng token của bạn
    const REPO_OWNER = 'YOUR_USERNAME'; // Thay thế bằng username GitHub của bạn
    const REPO_NAME = 'lol-match-scheduler';
    const DATA_FILE_PATH = 'data/matches.json';

    // Hàm lấy dữ liệu từ GitHub
    async function getMatches() {
        try {
            const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE_PATH}`);
            const data = await response.json();
            const content = atob(data.content);
            return JSON.parse(content).matches;
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu:', error);
            return [];
        }
    }

    // Hàm lưu dữ liệu lên GitHub
    async function saveMatches(matches) {
        try {
            // Lấy SHA của file hiện tại
            const getResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE_PATH}`);
            const getData = await getResponse.json();
            const currentSha = getData.sha;

            // Chuẩn bị dữ liệu mới
            const newContent = {
                matches: matches
            };
            const content = btoa(JSON.stringify(newContent, null, 2));

            // Cập nhật file
            const updateResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE_PATH}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: 'Cập nhật dữ liệu trận đấu',
                    content: content,
                    sha: currentSha
                })
            });

            if (!updateResponse.ok) {
                throw new Error('Lỗi khi lưu dữ liệu');
            }

            return true;
        } catch (error) {
            console.error('Lỗi khi lưu dữ liệu:', error);
            return false;
        }
    }

    // Hàm hiển thị danh sách trận đấu
    async function displayMatches(matches = null) {
        const matchList = $('#matchList');
        matchList.empty();

        const matchesToDisplay = matches || await getMatches();

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
    $('#matchForm').on('submit', async function(e) {
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
        const matches = await getMatches();
        matches.push(newMatch);
        const success = await saveMatches(matches);

        if (success) {
            // Hiển thị lại danh sách
            displayMatches();
            // Reset form
            this.reset();
            // Hiển thị thông báo
            showNotification('Tạo trận đấu thành công!', 'success');
        } else {
            showNotification('Lỗi khi tạo trận đấu!', 'error');
        }
    });

    // Hàm xóa trận đấu
    window.deleteMatch = async function(index) {
        if (confirm('Bạn có chắc muốn xóa trận đấu này?')) {
            const matches = await getMatches();
            matches.splice(index, 1);
            const success = await saveMatches(matches);
            
            if (success) {
                displayMatches();
                showNotification('Đã xóa trận đấu!', 'success');
            } else {
                showNotification('Lỗi khi xóa trận đấu!', 'error');
            }
        }
    };

    // Hàm chỉnh sửa trận đấu
    window.editMatch = async function(index) {
        const matches = await getMatches();
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
    $('#saveEditMatch').on('click', async function() {
        const index = $('#editMatchIndex').val();
        const matches = await getMatches();

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
        const success = await saveMatches(matches);
        
        if (success) {
            displayMatches();
            // Đóng modal
            $('#editMatchModal').modal('hide');
            // Hiển thị thông báo
            showNotification('Cập nhật trận đấu thành công!', 'success');
        } else {
            showNotification('Lỗi khi cập nhật trận đấu!', 'error');
        }
    });

    // Xử lý tìm kiếm
    $('#searchMatch').on('input', async function() {
        const searchTerm = $(this).val().toLowerCase();
        const matches = await getMatches();

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