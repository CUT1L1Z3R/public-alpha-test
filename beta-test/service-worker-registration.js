// Register Service Worker with update notification
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Use a fixed version to avoid frequent updates
        navigator.serviceWorker.register('/service-worker.js?v=1.0.5')
            .then(function(registration) {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);

                // Check for updates periodically (every hour)
                setInterval(function() {
                    registration.update();
                    console.log('Checking for service worker updates...');
                }, 60 * 60 * 1000);

                // Listen for new service workers
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('Service worker update found!');

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('New content is available, refresh to update.');

                            // Show a notification to the user about the update
                            const updateNotification = document.createElement('div');
                            updateNotification.style.position = 'fixed';
                            updateNotification.style.bottom = '20px';
                            updateNotification.style.right = '20px';
                            updateNotification.style.background = '#8d16c9';
                            updateNotification.style.color = 'white';
                            updateNotification.style.padding = '10px 20px';
                            updateNotification.style.borderRadius = '5px';
                            updateNotification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
                            updateNotification.style.zIndex = '9999';
                            updateNotification.innerHTML = 'New content available! <button id="update-button" style="background:#fff; color:#8d16c9; border:none; padding:5px 10px; margin-left:10px; border-radius:3px; cursor:pointer;">Refresh</button>';

                            document.body.appendChild(updateNotification);

                            document.getElementById('update-button').addEventListener('click', () => {
                                window.location.reload();
                            });
                        }
                    });
                });
            })
            .catch(function(error) {
                console.log('ServiceWorker registration failed: ', error);
            });

        // Listen for messages from the service worker
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                console.log('Update available, version:', event.data.version);

                // Show a notification to the user about the update
                const updateNotification = document.createElement('div');
                updateNotification.style.position = 'fixed';
                updateNotification.style.bottom = '20px';
                updateNotification.style.right = '20px';
                updateNotification.style.background = '#8d16c9';
                updateNotification.style.color = 'white';
                updateNotification.style.padding = '10px 20px';
                updateNotification.style.borderRadius = '5px';
                updateNotification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
                updateNotification.style.zIndex = '9999';
                updateNotification.innerHTML = 'New content available! <button id="update-button" style="background:#fff; color:#8d16c9; border:none; padding:5px 10px; margin-left:10px; border-radius:3px; cursor:pointer;">Refresh</button>';

                document.body.appendChild(updateNotification);

                document.getElementById('update-button').addEventListener('click', () => {
                    window.location.reload();
                });
            }
        });
    });
}
