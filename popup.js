(() => {
    const scaleInput = document.getElementById('scale-input');
    const replaceInput = document.getElementById('replace-input');
    const values = {
        scale: '',
        replace: false
    }

    chrome.storage.sync.get(['scale', 'replace'], ({ scale = '1.5', replace = false }) => {
        scaleInput.value = scale;
        replaceInput.checked = replace;
        values.scale = scale;
        values.replace = replace;
    })

    scaleInput.addEventListener('change', (event) => {
        if (/^[0-9.]*$/i.test(event.target.value)) {
            values.scale = event.target.value;
            chrome.storage.sync.set({ scale: Number(event.target.value) });
        } else {
            event.target.value = values.scale;
        }
    })

    replaceInput.addEventListener('change', (event) => {
        values.replace = event.target.checked;
        chrome.storage.sync.set({ replace: event.target.checked });
    })
})()
