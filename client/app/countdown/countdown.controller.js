(function() {
    'use strict';

    angular
        .module('pomodoro')
        .controller('CountdownController', CountdownController);

    CountdownController.$inject = ['$scope', '$timeout', 'COUNTDOWN_TYPES', '$stateParams', '$http'];

    function CountdownController($scope, $timeout, COUNTDOWN_TYPES, $stateParams, $http) {
        var vmCountdown = this,
            sounds = {
                ringer: null,
                ticker: null
            };

        // Methods
        vmCountdown.ringAlarm = ringAlarm;
        vmCountdown.shutUpAlarm = shutUpAlarm;
        vmCountdown.startTimer = startTimer;
        vmCountdown.stopTimer = stopTimer;
        vmCountdown.toggleTickerMute = toggleTickerMute;

        // Properties
        vmCountdown.currentTask = {};

        /* Init function*/
        (function activate() {

            console.log('$stateParams.task', $stateParams.task);
            vmCountdown.currentTask = $stateParams.task || {};
            
            vmCountdown.alarmDuration = 2000;
            vmCountdown.currentTimer = COUNTDOWN_TYPES.POMODORO;
            vmCountdown.elapsedPomodoros = vmCountdown.currentTask.elapsedPomodoros || 0;
            vmCountdown.elapsedTime = 0;
            vmCountdown.isTicking = false;
            vmCountdown.tickerSoundOn = true;

            initSounds();
            sounds.ticker.muted = !vmCountdown.tickerSoundOn;

            // This is ugly, I gotta say :(
            $scope.$on('timer-tick', function(event, value) {
                $timeout(function() {
                    vmCountdown.elapsedTime = vmCountdown.currentTimer.duration - (value.millis / 1000);
                    $scope.$apply();
                }, 0);
            });
        })();

        function initSounds() {
            sounds.ticker = new Audio('../../assets/sounds/kitchen_timer_counts_down.mp3');
            sounds.ringer = new Audio('../../assets/sounds/ring.ogg');

            sounds.ticker.loop = true;
            sounds.ringer.loop = true;
        }

        function playTicker() {
            sounds.ticker.play();
        }

        function ringAlarm() {
            stopTicker();
            sounds.ringer.play();

            if (vmCountdown.currentTimer === COUNTDOWN_TYPES.POMODORO) {
                if (vmCountdown.elapsedPomodoros > 0 && vmCountdown.elapsedPomodoros % 3 === 0) {
                    vmCountdown.currentTimer = COUNTDOWN_TYPES.LONG_BREAK;
                } else {
                    vmCountdown.currentTimer = COUNTDOWN_TYPES.SHORT_BREAK;
                }
                vmCountdown.elapsedPomodoros++;
                vmCountdown.currentTask.elapsedPomodoros = vmCountdown.elapsedPomodoros;


                $http({
                    method: 'PUT',
                    url: '/api/task/' + vmCountdown.currentTask._id,
                    data: vmCountdown.currentTask
                }).then(function success(res) {
                    console.log(res);
                }, function error(res) {
                    console.log(res);
                });

            } else {
                vmCountdown.currentTimer = COUNTDOWN_TYPES.POMODORO;
            }

            $scope.$apply(); // update the current timer key for the timer to use

            // will auto shut down the alarm after n seconds
            $timeout(function() {
                shutUpAlarm();
                startTimer();
            }, vmCountdown.alarmDuration);

        }

        function shutUpAlarm() {
            sounds.currentTime = 0;
            sounds.ringer.pause();
        }

        function startTimer() {
            document.getElementsByTagName('timer')[0].start();

            // in case the alarm is on
            shutUpAlarm();
            playTicker();
            vmCountdown.isTicking = true;
        }

        function stopTicker() {
            sounds.ticker.pause();
        }

        function stopTimer() {
            document.getElementsByTagName('timer')[0].reset();
            stopTicker();
            // in case the alarm is on
            shutUpAlarm();

            vmCountdown.isTicking = false;
            vmCountdown.currentTimer = COUNTDOWN_TYPES.POMODORO;

        }

        function toggleTickerMute() {
            sounds.ticker.muted = !vmCountdown.tickerSoundOn;
        }

    }
})();