// --- CHAT CON LA IA ---

async function askIA(Message) {
    const Content = new FormData();
    Content.append("message", Message);
    let response = await fetch('php/askIA.php', { method: 'POST', body: Content });
    let result = await response.text();
    Notificacion(JSON.parse(result).response)
}

const iaChatForm = document.getElementById('ia-chat-form');
const iaChatInput = document.getElementById('ia-chat-input');
const iaChatHistory = document.getElementById('ia-chat-history');

let iaChatMessages = [];
if (sessionStorage.getItem('iaChatMessages')) {
    iaChatMessages = JSON.parse(sessionStorage.getItem('iaChatMessages'));
    renderIAChatHistory();
}

iaChatForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const msg = iaChatInput.value.trim();
    if (!msg) return;
    addIAChatMessage('user', msg);
    iaChatInput.value = '';
    showIATyping();
    const response = await fetch('php/askIA.php', {
        method: 'POST',
        body: (() => {
            const fd = new FormData();
            fd.append('message', msg);
            return fd;
        })()
    });
    const data = await response.json();
    hideIATyping();
    addIAChatMessage('ia', data.response || 'No se obtuvo respuesta de la IA.');
});

function addIAChatMessage(role, text) {
    if (role === 'ia') {
        text = markdownToHtml(text);
        console.log("IA Response:", text);
    }
    iaChatMessages.push({ role, text });
    if (iaChatMessages.length > 20) iaChatMessages.shift();
    sessionStorage.setItem('iaChatMessages', JSON.stringify(iaChatMessages));
    renderIAChatHistory();
}

// Conversión básica de Markdown a HTML para respuestas de la IA
function markdownToHtml(md) {
    if (!md) return '';
    let html = md;

    // Tablas Markdown
    // Detecta bloques de tabla y los convierte a <table>
    html = html.replace(/((?:\|.*\|\n)+)/g, function (match) {
        const rows = match.trim().split('\n');
        if (rows.length < 2) return match; // No es tabla válida
        let thead = '';
        let tbody = '';
        rows.forEach((row, idx) => {
            // Quita | al inicio y final, y divide por |
            let cols = row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
            // Ignora la fila de separadores
            if (idx === 1 && /^:?-+:?$/.test(cols[0])) return;
            if (idx === 0) {
                thead = '<thead><tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr></thead>';
            } else if (idx > 1 || (idx === 1 && !/^:?-+:?$/.test(cols[0]))) {
                tbody += '<tr>' + cols.map(c => `<td>${c}</td>`).join('') + '</tr>';
            }
        });
        return `<table class="table table-bordered table-sm">${thead}<tbody>${tbody}</tbody></table>`;
    });

    // Encabezados
    html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>');
    html = html.replace(/^##### (.*)$/gm, '<h5>$1</h5>');
    html = html.replace(/^#### (.*)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');

    // Listas ordenadas y no ordenadas
    html = html.replace(/^\s*[-*+] (.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/(<ul>(?:<li>.*?<\/li>)+<\/ul>)/gs, function (match) {
        return match.replace(/<\/ul>\s*<ul>/g, '');
    });
    html = html.replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>');
    html = html.replace(/(<ol>(?:<li>.*?<\/li>)+<\/ol>)/gs, function (match) {
        return match.replace(/<\/ol>\s*<ol>/g, '');
    });

    // Negritas y cursivas
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    html = html.replace(/\*(.+?)\*/g, '<i>$1</i>');

    // Enlaces
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Código en bloque
    html = html.replace(/```([\s\S]*?)```/g, function (match, code) {
        return '<pre><code>' + code.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre>';
    });

    // Código en línea
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Saltos de línea
    html = html.replace(/\n{2,}/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '');

    return html;
}

function renderIAChatHistory() {
    iaChatHistory.innerHTML = '';
    iaChatMessages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'ia-message ' + (msg.role === 'user' ? 'user justify-content-end' : 'ia justify-content-start');
        if (msg.role === 'ia') {
            msgDiv.innerHTML = `
                <span class="ia-avatar"><i class="fa-solid fa-robot"></i></span>
                <span class="msg-bubble">${msg.text}</span>
            `;
        } else {
            msgDiv.innerHTML = `
                <span class="msg-bubble">${msg.text}</span>
                <span class="user-avatar"><i class="fa-solid fa-user"></i></span>
            `;
        }
        iaChatHistory.appendChild(msgDiv);
    });
    iaChatHistory.scrollTop = iaChatHistory.scrollHeight;
}

function showIATyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ia-message ia typing-indicator';
    typingDiv.id = 'ia-typing-indicator';
    typingDiv.innerHTML = `
        <span class="ia-avatar"><i class="fa-solid fa-robot"></i></span>
        <span class="msg-bubble">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </span>
    `;
    iaChatHistory.appendChild(typingDiv);
    iaChatHistory.scrollTop = iaChatHistory.scrollHeight;
}

function hideIATyping() {
    const typingDiv = document.getElementById('ia-typing-indicator');
    if (typingDiv) typingDiv.remove();
}

document.getElementById('btn-nuevo-chat').addEventListener('click', async function () {
    iaChatMessages = [];
    sessionStorage.removeItem('iaChatMessages');
    renderIAChatHistory();
    // Limpia la sesión en el backend
    await fetch('php/askIA.php', {
        method: 'POST',
        body: (() => {
            const fd = new FormData();
            fd.append('reset_session', '1');
            return fd;
        })()
    });
});