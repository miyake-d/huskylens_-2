AI_Camera.initI2c()
AI_Camera.initMode(protocolAlgorithm.ALGORITHM_FACE_RECOGNITION)
basic.pause(100)
control.inBackground(function () {
    while (true) {
        AI_Camera.request()
        if (AI_Camera.isAppear(0, HUSKYLENSResultType_t.HUSKYLENSResultBlock)) {
            basic.showIcon(IconNames.Yes)
        } else {
            basic.showIcon(IconNames.No)
        }
    }
})
