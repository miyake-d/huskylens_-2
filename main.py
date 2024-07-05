def on_forever():
    if Toi.tof_value() >= 20:
        Toi.左サーボ前回転速度(4)
        Toi.右サーボ前回転速度(4)
        basic.pause(200)
    else:
        Toi.左サーボ前回転速度(2)
        Toi.右サーボ停止()
        basic.pause(200)
        Toi.左サーボ停止()
        Toi.右サーボ前回転速度(2)
        basic.pause(200)
basic.forever(on_forever)
