const { ipcRenderer } = require("electron");

var campos = [];

var labels = [];

window.addEventListener('DOMContentLoaded', async () => {
    try {
        const query = 'SHOW COLUMNS FROM EQUIPE';
        const results = await ipcRenderer.invoke('execute-query', query);

        ipcRenderer.send('get-html-template', results);

        ipcRenderer.on('html-template', (_, htmlTemplates) => {
            const tempContainer = document.createElement('div');

            tempContainer.innerHTML = htmlTemplates.join('');;

            for (let childNode of tempContainer.childNodes) {
                if (childNode.childNodes.length > 1) {
                    document.body.appendChild(childNode);
                }
            }

            campos = document.querySelectorAll('.TextField');
            labels = document.querySelectorAll('.Label');
    
            for (let i = 0; i < labels.length; i++) {
                if (i < results.length) {
                    labels[i].textContent = results[i].Field;
                }
            }
        });
        

    } catch (error) {
        ipcRenderer.send('show-popup', error.message || 'An error occurred.');
    }
});

async function executeQuery() {
    try {
        let fields = [];
        for (let i of campos) {
            fields.push(i.value);
        }

        const query = `INSERT INTO EQUIPE (idEquipe, primeiroNome, ultimoNome, email, numCelular, idGerente) VALUES ('${fields[0]}', '${fields[1]}', '${fields[2]}', '${fields[3]}', '${fields[4]}', '${fields[5]}')`;

        for (let campo of campos) {
            campo.value = "";
        }

        const results = await ipcRenderer.invoke('execute-query', query);
    } catch (error) {
        const errorMessage = error.message || 'An error occurred.';
        const match = /.*?: (.*)$/.exec(errorMessage);
        const specificErrorMessage = match ? match[1] : errorMessage;

        ipcRenderer.send('show-popup', specificErrorMessage);
    }
}

function create_list(results) {
    let main = document.createElement('main');

    for (let result of results) {

        let section = document.createElement('section');
        let ul = document.createElement('ul');

        for (let key in result) {
            if (result.hasOwnProperty(key)) {
                let list = document.createElement('li');
                let textNode = document.createTextNode(`${key}: ${result[key]}`);

                list.append(textNode);
                ul.append(list);
            }
        }
        section.append(ul);
        main.append(section);
    }

    document.body.append(main);
}

document.addEventListener('DOMContentLoaded', () => {
    const executeButton = document.getElementById('executeButton');
    const leaveButton = document.getElementById('leaveButton');

    executeButton.addEventListener('click', () => {
        executeQuery();
    });

    leaveButton.addEventListener('click', () => {
        window.alert("Thanks for using my app!");
        ipcRenderer.send('quit-app');
    });
});