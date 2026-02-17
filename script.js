let milkChartInstance = null;

function checkLogin() {
    const input = document.getElementById('passkey').value;
    if (input === "Miheso@2026") {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('main-dashboard').style.display = 'block';
        loadAllData();
    } else {
        document.getElementById('error-msg').innerText = "Incorrect Code!";
    }
}

function toggleTheme() {
    const body = document.body;
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        document.getElementById('theme-btn').innerText = "🌙 Dark Mode";
    } else {
        body.setAttribute('data-theme', 'dark');
        document.getElementById('theme-btn').innerText = "☀️ Light Mode";
    }
}

function showSection(sectionId, event) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(sectionId).classList.remove('hidden');
    event.currentTarget.classList.add('active');
    if(sectionId === 'reports') prepareReport();
}

function deleteRecord(key, index, refreshFunction) {
    if (confirm("Delete this record permanently?")) {
        let data = JSON.parse(localStorage.getItem(key)) || [];
        data.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(data));
        refreshFunction();
        updateHomeDashboard();
    }
}

function factoryReset() {
    const confirmation = prompt("To clear ALL data, please type 'RESET':");
    if (confirmation === "RESET") {
        localStorage.clear();
        alert("All farm data has been wiped.");
        location.reload();
    }
}

function downloadBackup() {
    const farmData = {
        milkLogs: JSON.parse(localStorage.getItem('milkLogs')) || [],
        cropLogs: JSON.parse(localStorage.getItem('cropLogs')) || [],
        vetVisits: JSON.parse(localStorage.getItem('vetVisits')) || [],
        breedingLogs: JSON.parse(localStorage.getItem('breedingLogs')) || [],
        farmFeeds: JSON.parse(localStorage.getItem('farmFeeds')) || []
    };

    const dataStr = JSON.stringify(farmData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `My_Farm_Backup_${date}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert("Backup successful! Every record from all sections has been saved.");
}

function saveMilkRecord() {
    const date = document.getElementById('milk-date').value;
    const session = document.getElementById('milk-session').value;
    const liters = document.getElementById('milk-liters').value;
    const price = document.getElementById('milk-price').value;
    if(!date || !liters) return;
    let logs = JSON.parse(localStorage.getItem('milkLogs')) || [];
    logs.push({ date, session, liters, totalKsh: liters * price });
    localStorage.setItem('milkLogs', JSON.stringify(logs));
    displayMilk();
}

function displayMilk() {
    const logs = JSON.parse(localStorage.getItem('milkLogs')) || [];
    const tbody = document.getElementById('milk-data-body');
    tbody.innerHTML = logs.map((l, index) => `
        <tr><td>${l.date}</td><td>${l.session}</td><td>${l.liters}L</td><td>${l.totalKsh}</td>
        <td><button class="btn-delete" onclick="deleteRecord('milkLogs', ${index}, displayMilk)">Delete</button></td></tr>
    `).join('');
    updateHomeDashboard();
}

function saveBreedingRecord() {
    const cow = document.getElementById('cow-name').value;
    const date = document.getElementById('ai-date').value;
    const breed = document.getElementById('bull-breed').value;
    if(!cow || !date) return;
    const dueDate = new Date(new Date(date).setDate(new Date(date).getDate() + 280)).toDateString();
    let logs = JSON.parse(localStorage.getItem('breedingLogs')) || [];
    logs.push({ cow, date, breed, dueDate });
    localStorage.setItem('breedingLogs', JSON.stringify(logs));
    displayBreeding();
    checkBreedingAlerts();
}

function displayBreeding() {
    const logs = JSON.parse(localStorage.getItem('breedingLogs')) || [];
    document.getElementById('breeding-display').innerHTML = logs.map((l, index) => `
        <div class="card" style="display:flex; justify-content:space-between; align-items:center;">
            <div>🍼 <strong>${l.cow}</strong>: AI ${l.date} (Due: ${l.dueDate})</div>
            <button class="btn-delete" onclick="deleteRecord('breedingLogs', ${index}, displayBreeding)">X</button>
        </div>
    `).join('');
}

function checkBreedingAlerts() {
    const logs = JSON.parse(localStorage.getItem('breedingLogs')) || [];
    const list = document.getElementById('alert-list');
    const today = new Date();
    list.innerHTML = "";
    let count = 0;
    logs.forEach(l => {
        const days = Math.ceil((new Date(l.dueDate) - today) / (1000 * 3600 * 24));
        if (days <= 14 && days >= -5) {
            count++;
            list.innerHTML += `<li><strong>${l.cow}</strong> is due in ${days} days!</li>`;
        }
    });
    document.getElementById('breeding-alert-box').style.display = count > 0 ? "block" : "none";
    updateHomeDashboard();
}

function saveCropRecord() {
    const type = document.getElementById('crop-type').value;
    const bags = parseInt(document.getElementById('crop-bags').value);
    const action = document.getElementById('crop-action').value;
    if(!bags) return;
    let logs = JSON.parse(localStorage.getItem('cropLogs')) || [];
    logs.push({ type, bags, action, date: new Date().toLocaleDateString() });
    localStorage.setItem('cropLogs', JSON.stringify(logs));
    displayCrops();
}

function displayCrops() {
    const logs = JSON.parse(localStorage.getItem('cropLogs')) || [];
    const tbody = document.getElementById('crop-history-body');
    let totals = { Maize: { Stored: 0, Sold: 0 }, Beans: { Stored: 0, Sold: 0 } };
    tbody.innerHTML = logs.map((l, index) => {
        if (totals[l.type]) totals[l.type][l.action] += l.bags;
        return `<tr><td>${l.date}</td><td>${l.type}</td><td>${l.action}</td><td>${l.bags}</td>
        <td><button class="btn-delete" onclick="deleteRecord('cropLogs', ${index}, displayCrops)">X</button></td></tr>`;
    }).join('');
    document.getElementById('maize-stored').innerText = totals.Maize.Stored;
    document.getElementById('maize-sold').innerText = totals.Maize.Sold;
    document.getElementById('beans-stored').innerText = totals.Beans.Stored;
    document.getElementById('beans-sold').innerText = totals.Beans.Sold;
    updateHomeDashboard();
}

function saveVetVisit() {
    const date = document.getElementById('vet-date').value;
    const reason = document.getElementById('vet-reason').value;
    const cost = document.getElementById('vet-cost').value;
    if(!date || !reason) return;
    let visits = JSON.parse(localStorage.getItem('vetVisits')) || [];
    visits.push({ date, reason, cost });
    localStorage.setItem('vetVisits', JSON.stringify(visits));
    displayVetVisits();
}

function displayVetVisits() {
    const visits = JSON.parse(localStorage.getItem('vetVisits')) || [];
    document.getElementById('vet-list').innerHTML = visits.map((v, index) => `<li>${v.date}: ${v.reason} (Ksh ${v.cost}) <button onclick="deleteRecord('vetVisits', ${index}, displayVetVisits)">X</button></li>`).join('');
    updateHomeDashboard();
}

function saveFeedRecord() {
    const name = document.getElementById('feed-name').value;
    const target = document.getElementById('feed-target').value;
    if(!name) return;
    let feeds = JSON.parse(localStorage.getItem('farmFeeds')) || [];
    feeds.push({ name, target });
    localStorage.setItem('farmFeeds', JSON.stringify(feeds));
    displayFeeds();
}

function displayFeeds() {
    const feeds = JSON.parse(localStorage.getItem('farmFeeds')) || [];
    document.getElementById('feed-list').innerHTML = feeds.map((f, index) => `<li>${f.name} for ${f.target} <button onclick="deleteRecord('farmFeeds', ${index}, displayFeeds)">X</button></li>`).join('');
}

function updateHomeDashboard() {
    const milk = JSON.parse(localStorage.getItem('milkLogs')) || [];
    const crops = JSON.parse(localStorage.getItem('cropLogs')) || [];
    const v = JSON.parse(localStorage.getItem('vetVisits')) || [];
    const b = JSON.parse(localStorage.getItem('breedingLogs')) || [];
    let ltr = 0, ksh = 0, m = 0, beans = 0;
    milk.forEach(l => { ltr += parseFloat(l.liters); ksh += parseFloat(l.totalKsh); });
    crops.forEach(l => { if(l.type === "Maize" && l.action === "Stored") m += l.bags; if(l.type === "Beans" && l.action === "Stored") beans += l.bags; });
    document.getElementById('home-weekly-liters').innerText = ltr.toFixed(1) + " L";
    document.getElementById('home-weekly-earnings').innerText = ksh.toLocaleString() + " Ksh";
    document.getElementById('home-maize').innerText = m + " Bags";
    document.getElementById('home-beans').innerText = beans + " Bags";
    document.getElementById('home-vet-visits').innerText = v.length;
}

function renderMilkChart() {
    const ctx = document.getElementById('milkChart').getContext('2d');
    const logs = JSON.parse(localStorage.getItem('milkLogs')) || [];
    const daily = {};
    logs.forEach(l => daily[l.date] = (daily[l.date] || 0) + parseFloat(l.liters));
    const labels = Object.keys(daily).sort().slice(-7);
    const data = labels.map(label => daily[label]);
    if (milkChartInstance) milkChartInstance.destroy();
    milkChartInstance = new Chart(ctx, {
        type: 'line',
        data: { 
            labels, 
            datasets: [{ 
                label: 'Daily Liters Produced', 
                data, 
                borderColor: '#008000', 
                backgroundColor: 'rgba(0, 128, 0, 0.1)',
                fill: true, 
                tension: 0.3 
            }] 
        },
        options: { responsive: true }
    });
}

function prepareReport() {
    const milk = JSON.parse(localStorage.getItem('milkLogs')) || [];
    const vet = JSON.parse(localStorage.getItem('vetVisits')) || [];
    document.getElementById('report-content').innerHTML = `
        <h3>Recent Milk Production</h3>` + 
        milk.slice(-10).map(l => `<p>${l.date}: ${l.liters}L (${l.session})</p>`).join('') + 
        `<h3>Medical History</h3>` + 
        vet.map(v => `<p>${v.date}: ${v.reason}</p>`).join('');
    renderMilkChart();
}

function shareToWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent("Miheso Farm Progress Report! 🐄🌽")}`, '_blank');
}

function loadAllData() {
    displayMilk(); displayBreeding(); displayCrops(); displayVetVisits(); displayFeeds(); checkBreedingAlerts(); updateHomeDashboard();

}
