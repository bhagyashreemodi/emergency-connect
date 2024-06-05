class ESNSpeedTest {
    constructor() {
        this.cancelSpeedTest = false;
        this.speedTestRunning = false;
        this.maxPostRequestsReached = false;
        this.initEventHandlers();
    }

    initEventHandlers() {
        $(document).ready(function () {
            $('#startSpeedTestButton').click(async function () {
                console.log("loading speed test...");
                const hash = window.location.hash;
                let tabName = hash ? hash.substring(1) : 'esn-directory';
                const tabElement = `#${tabName}-tab`;
                $(tabElement).removeClass('active');
                const response = await axios.get(`/esn-speed-test`);
                $('#tab-content').html(response.data);
                esnSpeedTest.bindButtonClickListener();
            });
        });
    }

    bindButtonClickListener() {
        $('#cancelSpeedTest').click(async function (event) {
            console.log("Cancel speed test clicked...");
            event.preventDefault();
            esnSpeedTest.cancelSpeedTest = true;
        });

        $('#submitSpeedTest').click(async function (event) {
            console.log("Start speed test clicked...");
            event.preventDefault();
            const isValid = esnSpeedTest.validateInput();
            if (!isValid) {
                return;
            }
            esnSpeedTest.disableOtherClicks();
            await esnSpeedTest.startSpeedTest();
        });
    }

    async startSpeedTest() {
        console.log("Starting speed test...");
        const duration = parseInt($('#testDuration').val(), 10);
        const interval = parseInt($('#requestInterval').val(), 10);

        // Show progress loader
        $('#progressLoader').show();
        $('#testResults').hide();
        $('.validation-error').hide()
        $('#submitSpeedTest').prop('disabled', true);
        this.cancelSpeedTest = false;
        this.speedTestRunning = true;
        try {
            await this.setupDBAndTest();
            const actualDurationOfSpeedTest = (duration) * 1000;
            const postResults = await this.startPostRequests(actualDurationOfSpeedTest / 2, interval);
            if(this.maxPostRequestsReached) {
                $('#testResults').next('.validation-error').show();
                $('#progressLoader').hide();
                this.enableOtherClicks();
                this.cancelSpeedTest = false;
                return;
            }
            const getResults = await this.startGetRequests(actualDurationOfSpeedTest / 2, interval);
            await this.stopSpeedTest();
            this.speedTestRunning = false;
            $('#progressLoader').hide();
            if(!this.cancelSpeedTest) {
                this.displayResults(postResults, getResults);
            }
            else {
                $('#speedTestForm')[0].reset();
                $('#submitSpeedTest').prop('disabled', false);
                $('#loader').hide();
                //$('.validation-error').hide();
                $('#progressLoader').hide();
                $('#testResults').hide();
            }
        } catch (error) {
            console.error("Failed to run speed test.", error);
        } finally {
            this.cancelSpeedTest = false;
            $('#progressLoader').hide();
            this.enableOtherClicks();
        }
    }

    async setupDBAndTest() {
        console.log("Setting up DB and test...");
        await axios.put(`/speedtest/running`, {headers: {'X-Speed-Test': true}});
    }

    async startPostRequests(duration, interval) {
        const messageContent = 'This is for speed test.';
        let postRequestsCount = 0;
        const maxPostRequests = 1000;
        const startTime = Date.now();
        try {
            while ((Date.now() - startTime) <= duration && !this.cancelSpeedTest && !this.maxPostRequestsReached) {
                if (postRequestsCount >= maxPostRequests) {
                    this.maxPostRequestsReached = true;
                }
                await axios.post('/messages/public', {messageContent}, {headers: {'X-Speed-Test': true}});
                postRequestsCount++;
                await this.sleep(interval);
            }
            console.log(`Post requests count: ${postRequestsCount}`);
            const actualDuration = (duration - (postRequestsCount * interval)) / 1000;
            return postRequestsCount / actualDuration;

        } catch (error) {
            console.error("Failed to send post request.", error);
            throw error;
        }

    }

    async startGetRequests(duration, interval) {
        let getRequestsCount = 0;
        const startTime = Date.now();
        try {
            while ((Date.now() - startTime) <= duration && !this.cancelSpeedTest) {
                console.log("Sending get request...");
                await axios.get('/messages/public', {headers: {'X-Speed-Test': true}});
                getRequestsCount++;
                await this.sleep(interval);
                console.log(`Elapsed time: ${Date.now() - startTime}`);
            }
            const actualDuration = (duration - (getRequestsCount * interval)) / 1000;
            return getRequestsCount / actualDuration;
        } catch (error) {
            console.error("Failed to send get request.", error);
            throw error;
        }
    }


    async stopSpeedTest() {
        try {
            console.log("Stopping speed test...");
            await axios.put(`/speedtest/stopped`, {}, {headers: {'X-Speed-Test': true}});
        } catch (error) {
            console.error("Failed to stop speed test.", error);
            throw error;
        }
    }

    displayResults(postResults, getResults) {
        $('#testResults').show().html(`
        <p>POST Throughput: ${postResults.toFixed(2)} requests/sec</p>
        <p>GET Throughput: ${getResults.toFixed(2)} requests/sec</p>
    `);
        $('#submitSpeedTest').prop('disabled', false);
        this.enableOtherClicks();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    validateInput() {
        const duration = $('#testDuration').val();
        const interval = $('#requestInterval').val();
        let isValid = true;
        if (duration === '' || duration < 1) {
            $('#testDuration').next('.validation-error').show();
            isValid = false;
        } else {
            $('#testDuration').next('.validation-error').hide();
        }
        if (interval === '' || interval < 1) {
            $('#requestInterval').next('.validation-error').show();
            isValid = false;
        } else {
            $('#requestInterval').next('.validation-error').hide();
        }
        return isValid;
    }

    disableOtherClicks() {
        $('button, a').not('#cancelSpeedTest').prop('disabled', true).addClass('disabled');
        $('a').not('#cancelSpeedTest').click(false); // Prevent clicking on links
    }

    enableOtherClicks() {
        $('button, a').prop('disabled', false).removeClass('disabled');
        $('a').click(true);
    }
}
esnSpeedTest = new ESNSpeedTest();
$(window).on('beforeunload', async function () {
    if (esnSpeedTest.speedTestRunning) {
        console.log("Stopping speed test before unloading...");
        await esnSpeedTest.stopSpeedTest();
    }
});