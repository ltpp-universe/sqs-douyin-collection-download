const show_error_exit_msg_time = 10000;
const app_path = '/DouYinDownload';
const app_config_path = '/DouYinDownloadConfig.json';

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
    sleep,
    app_path,
    app_config_path,
    show_error_exit_msg_time
}