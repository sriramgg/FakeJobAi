let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;

    // Show the install button
    showInstallButton();
});

function showInstallButton() {
    const installBtn = document.getElementById('pwaInstallBtn');
    if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
            }
        });
    }
}

window.addEventListener('appinstalled', () => {
    // Hide the app-provided install promotion
    const installBtn = document.getElementById('pwaInstallBtn');
    if (installBtn) installBtn.style.display = 'none';
    console.log('PWA was installed');
});
