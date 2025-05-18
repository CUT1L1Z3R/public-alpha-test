// Enhanced version tracking with better cache control
(function() {
    const lastUpdate = localStorage.getItem('lastUpdate');
    const currentVersion = '1.0.5'; // Update this when making changes

    // Function to add cache-busting query params to resource URLs
    function updateResourceVersions() {
        const timestamp = new Date().getTime();
        const scripts = document.getElementsByTagName('script');
        const styles = document.getElementsByTagName('link');

        // Update script sources with timestamp
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i];
            if (script.src && !script.src.includes('data-cfasync') && !script.src.includes('service-worker.js')) {
                const url = new URL(script.src);
                url.searchParams.set('v', currentVersion);
                script.setAttribute('data-original-src', script.src);
                // Don't actually change src as it would reload the script
                // Just update for next page load
            }
        }

        // Update stylesheet links with version
        for (let i = 0; i < styles.length; i++) {
            const style = styles[i];
            if (style.href && style.rel === 'stylesheet') {
                const url = new URL(style.href);
                url.searchParams.set('v', currentVersion);
                style.setAttribute('data-original-href', style.href);
                // Don't actually change href as it would reload the style
                // Just update for next page load
            }
        }

        // Log the update
        console.log('Resources versioned for next load:', currentVersion);
    }

    // Check if this is a new version
    if (lastUpdate !== currentVersion) {
        localStorage.setItem('lastUpdate', currentVersion);
        console.log('Updated to version:', currentVersion);

        // Just update resource versions without forcing reload
        updateResourceVersions();

        // Create a notification for the user
        const versionNotice = document.createElement('div');
        versionNotice.style.position = 'fixed';
        versionNotice.style.bottom = '20px';
        versionNotice.style.left = '20px';
        versionNotice.style.background = 'rgba(0,0,0,0.8)';
        versionNotice.style.color = 'white';
        versionNotice.style.padding = '10px 15px';
        versionNotice.style.borderRadius = '5px';
        versionNotice.style.zIndex = '9999';
        versionNotice.style.fontSize = '14px';
        versionNotice.innerHTML = `FreeFlix updated to v${currentVersion}`;
        versionNotice.style.transition = 'opacity 0.5s ease-in-out';
        versionNotice.style.opacity = '0';

        // Add notification after a delay
        setTimeout(() => {
            document.body.appendChild(versionNotice);
            setTimeout(() => {
                versionNotice.style.opacity = '1';
                setTimeout(() => {
                    versionNotice.style.opacity = '0';
                    setTimeout(() => {
                        if (versionNotice.parentNode) {
                            versionNotice.parentNode.removeChild(versionNotice);
                        }
                    }, 500);
                }, 3000);
            }, 100);
        }, 2000);
    }
})();
