const show_error_exit_msg_time = 10000;
const app_path = '/DouYinDownload';
const app_config_path = '/DouYinDownloadConfig.json';
const aid = 6383;

const sleep = function (time) {
    return new Promise((resolve) => {
        try {
            setTimeout(() => {
                resolve();
            }, time);
        } catch {
            return resolve();
        }
    });
}

module.exports = {
    aid,
    sleep,
    app_path,
    app_config_path,
    show_error_exit_msg_time
}