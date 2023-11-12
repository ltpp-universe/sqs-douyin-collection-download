const show_error_exit_msg_time = 10000;
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
    show_error_exit_msg_time,
    sleep
}