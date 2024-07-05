let 物体までの距離 = 0;
let 文字列の長さ = 0;
let servo_position = 0;
let count = 0;
let servo1;
let servo2;
let servo3;

enum PingUnit {
    //% block="マイクロ秒（μs）"
    MicroSeconds = 0,
    //% block="センチ（cm）"
    Centimeters = 1,
    //% block="インチ（inches）"
    Inches = 2
}
enum I2C_ADDR {
    //% block="0x27"
    addr1 = 0x27,
    //% block="0x3f"
    addr2 = 0x3f,
    //% block="0x20"
    addr3 = 0x20,
    //% block="0x62"
    addr4 = 0x62,
    //% block="0x3e"
    addr5 = 0x3e
}
enum on_off {
    //% block="オン"
    on = 1,
    //% block="オフ"
    off = 0
}
enum visibled {
    //% block="表示"
    visible = 1,
    //% block="非表示"
    invisible = 0
}

/**
 * 〈Toi〉
 */
//% weight=100 color=#a0522d icon="\uf1b9" block="〈Toi〉"
namespace Toi {
    export let LCD_I2C_ADDR = 0x3f
    let buf = 0x00
    let BK = 0x08
    let RS = 0x00
    let E = 0x04

    function setReg(dat: number): void {
        pins.i2cWriteNumber(LCD_I2C_ADDR, dat, NumberFormat.UInt8BE, false)
        basic.pause(1)
    }

    function send(dat: number): void {
        let d = dat & 0xF0
        d |= BK
        d |= RS
        setReg(d)
        setReg(d | 0x04)
        setReg(d)
    }

    function setcmd(cmd: number): void {
        RS = 0
        send(cmd)
        send(cmd << 4)
    }

    function setdat(dat: number): void {
        RS = 1
        send(dat)
        send(dat << 4)
    }

    function setI2CAddress(): void {
        setcmd(0x33)
        basic.pause(5)
        send(0x30)
        basic.pause(5)
        send(0x20)
        basic.pause(5)
        setcmd(0x28)
        setcmd(0x0C)
        setcmd(0x06)
        setcmd(0x01)
    }

    /**
     * I2Cアドレスの初期化
     */
    //% blockId="LCD_setAddress" block="ディスプレイ I2Cアドレス %myAddr"
    //% weight=63 blockExternalInputs=true
    export function setAddress(myAddr: I2C_ADDR): void {
        LCD_I2C_ADDR = myAddr
        setI2CAddress()
    }

    /**
     * I2Cアドレスの初期化（数字）
     */
    //% blockId="LCD_setAddress2" block="ディスプレイ I2C アドレス %myAddr"
    //% weight=62 blockExternalInputs=true
    export function setAddress2(myAddr: number): void {
        LCD_I2C_ADDR = myAddr
        setI2CAddress()
    }

    /**
     * ディスプレイに文字列を表示する
     */
    //% blockId="LCD_putString" block="ディスプレイ 文字列を表示 %s|列:%x|行:%y"
    //% weight=61 blockExternalInputs=true x.min=0 x.max=15 y.min=0 y.max=1
    export function putString(s: string, x: number, y: number): void {
        if (s.length > 0) {
            let breakPoint = -1
            printChar(s.charCodeAt(0), x, y)
            if (y == 0)
                breakPoint = 16 - x
            for (let i = 1; i < s.length; i++) {
                if (i == breakPoint)
                    printChar(s.charCodeAt(i), 0, 1)
                else
                    printChar(s.charCodeAt(i), -1, 0)
            }
        }
    }

    /**
     * ディスプレイに数字を表示する
     */
    //% blockId="LCD_putNumber" block="ディスプレイ 数字を表示 %n|列:%x|行:%y"
    //% weight=60 blockExternalInputs=true x.min=0 x.max=15 y.min=0 y.max=1
    export function putNumber(n: number, x: number, y: number): void {
        putString(n.toString(), x, y)
    }

    /**
     * ディスプレイの文字列の表示設定
     */
    //% blockId="LCD_Show" block="ディスプレイ 文字列の表示設定 %show"
    //% weight=59
    export function set_LCD_Show(show: visibled): void {
        if (show == 1)
            setcmd(0x0C)
        else
            setcmd(0x08)
    }

    function printChar(ch: number, x: number, y: number): void {
        if (x >= 0) {
            let a = 0x80
            if (y == 1)
                a = 0xC0
            if (y == 2)
                a = 0x80 + 0x14
            if (y == 3)
                a = 0xC0 + 0x14
            a += x
            setcmd(a)
        }
        setdat(ch)
    }

    /**
     * ディスプレイのバックライトの設定
     */
    //% blockId="LCD_backlight" block="ディスプレイ バックライトの設定 %on"
    //% weight=58
    export function set_backlight(on: on_off): void {
        if (on == 1)
            BK = 0x08
        else
            BK = 0x00
        setcmd(0x00)
    }

    /**
     * ディスプレイの画面クリア
     */
    //% blockId="LCD_clear" block="ディスプレイ 画面クリア"
    //% weight=57
    export function clear(): void {
        setcmd(0x01)
    }

    /**
     * ディスプレイ画面に表示している文字や数字を左に移動させる
     */
    //% blockId="LCD_shl" block="ディスプレイ 左に移動"
    //% weight=56
    export function shl(): void {
        setcmd(0x18)
    }

    /**
     * ディスプレイ画面に表示している文字や数字を右に移動させる
     */
    //% blockId="LCD_shr" block="ディスプレイ 右に移動"
    //% weight=55
    export function shr(): void {
        setcmd(0x1C)
    }

    /**
     * pingピンから信号を送信し、その結果としてエコー時間（マイクロ秒）を取得する。
     * @param trig tigger pin
     * @param echo echo pin
     * @param unit desired conversion unit
     * @param maxCmDistance maximum distance in centimeters (default is 500)
     */
    //% block="超音波センサ | trigピン %trig|echoピン %echo|unitピン %unit"
    //% weight=80
    export function ping(trig: DigitalPin, echo: DigitalPin, unit: PingUnit, maxCmDistance = 500): number {
        // パルスを送る
        pins.setPull(trig, PinPullMode.PullNone);
        pins.digitalWritePin(trig, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);

        // パルスを読み取る
        const d = pins.pulseIn(echo, PulseValue.High, maxCmDistance * 58);

        switch (unit) {
            case 1: return Math.idiv(d, 58);
            case 2: return Math.idiv(d, 148);
            default: return d;
        }
    }
    let i2cAddr = 0x29
    let IO_TIMEOUT = 1000
    let SYSRANGE_START = 0x00
    let EXTSUP_HV = 0x89
    let MSRC_CONFIG = 0x60
    let FINAL_RATE_RTN_LIMIT = 0x44
    let SYSTEM_SEQUENCE = 0x01
    let SPAD_REF_START = 0x4f
    let SPAD_ENABLES = 0xb0
    let REF_EN_START_SELECT = 0xb6
    let SPAD_NUM_REQUESTED = 0x4e
    let INTERRUPT_GPIO = 0x0a
    let INTERRUPT_CLEAR = 0x0b
    let GPIO_MUX_ACTIVE_HIGH = 0x84
    let RESULT_INTERRUPT_STATUS = 0x13
    let RESULT_RANGE_STATUS = 0x14
    let OSC_CALIBRATE = 0xf8
    let MEASURE_PERIOD = 0x04

    let started = false
    let stop_variable = 0
    let spad_count = 0
    let is_aperture = false
    let spad_map: number[] = [0, 0, 0, 0, 0, 0]

    function readReg(raddr: number): number {
        pins.i2cWriteNumber(i2cAddr, raddr, NumberFormat.UInt8BE, false)
        let d = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt8BE, false)
        return d;
    }

    function readReg16(raddr: number): number {
        pins.i2cWriteNumber(i2cAddr, raddr, NumberFormat.UInt8BE, false)
        let d = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt16BE, false)
        return d;
    }

    function writeReg(raddr: number, d: number): void {
        pins.i2cWriteNumber(i2cAddr, ((raddr << 8) + d), NumberFormat.UInt16BE, false)
    }

    function writeReg16(raddr: number, d: number): void {
        pins.i2cWriteNumber(i2cAddr, raddr, NumberFormat.UInt8BE, false)
        pins.i2cWriteNumber(i2cAddr, d, NumberFormat.UInt16BE, false)
    }

    function readFlag(register: number = 0x00, bit: number = 0): number {
        let data = readReg(register)
        let mask = 1 << bit
        return (data & mask)
    }

    function writeFlag(register: number = 0x00, bit: number = 0, onflag: boolean): void {
        let data = readReg(register)
        let mask = 1 << bit
        if (onflag)
            data |= mask
        else
            data &= ~mask
        writeReg(register, data)
    }
    /**
     * VL53L0X Initialize
     */
    function init(): void {
        let r1 = readReg(0xc0)
        let r2 = readReg(0xc1)
        let r3 = readReg(0xc2)

        if (r1 != 0xEE || r2 != 0xAA || r3 != 0x10) {
            return
        }
        let power2v8 = true
        writeFlag(EXTSUP_HV, 0, power2v8)

        // I2C standard mode
        writeReg(0x88, 0x00)
        writeReg(0x80, 0x01)
        writeReg(0xff, 0x01)
        writeReg(0x00, 0x00)
        stop_variable = readReg(0x91)
        writeReg(0x00, 0x01)
        writeReg(0xff, 0x00)
        writeReg(0x80, 0x00)

        writeFlag(MSRC_CONFIG, 1, true)
        writeFlag(MSRC_CONFIG, 4, true)

        writeReg16(FINAL_RATE_RTN_LIMIT, Math.floor(0.25 * (1 << 7)))

        writeReg(SYSTEM_SEQUENCE, 0xff)

        if (!spad_info())
            return

        pins.i2cWriteNumber(i2cAddr, SPAD_ENABLES, NumberFormat.UInt8BE, false)
        let sp1 = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt16BE, false)
        let sp2 = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt16BE, false)
        let sp3 = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt16BE, false)
        spad_map[0] = (sp1 >> 8) & 0xFF
        spad_map[1] = sp1 & 0xFF
        spad_map[2] = (sp2 >> 8) & 0xFF
        spad_map[3] = sp2 & 0xFF
        spad_map[4] = (sp3 >> 8) & 0xFF
        spad_map[5] = sp3 & 0xFF

        // set reference spads
        writeReg(0xff, 0x01)
        writeReg(SPAD_REF_START, 0x00)
        writeReg(SPAD_NUM_REQUESTED, 0x2c)
        writeReg(0xff, 0x00)
        writeReg(REF_EN_START_SELECT, 0xb4)

        let spads_enabled = 0
        for (let i = 0; i < 48; i++) {
            if ((i < 12 && is_aperture) || (spads_enabled >= spad_count)) {
                spad_map[i >> 3] &= ~(1 << (i >> 2))
            } else if (spad_map[i >> 3] & (1 << (i >> 2))) {
                spads_enabled += 1
            }
        }

        writeReg(0xff, 0x01)
        writeReg(0x00, 0x00)

        writeReg(0xff, 0x00)
        writeReg(0x09, 0x00)
        writeReg(0x10, 0x00)
        writeReg(0x11, 0x00)

        writeReg(0x24, 0x01)
        writeReg(0x25, 0xFF)
        writeReg(0x75, 0x00)

        writeReg(0xFF, 0x01)
        writeReg(0x4E, 0x2C)
        writeReg(0x48, 0x00)
        writeReg(0x30, 0x20)

        writeReg(0xFF, 0x00)
        writeReg(0x30, 0x09)
        writeReg(0x54, 0x00)
        writeReg(0x31, 0x04)
        writeReg(0x32, 0x03)
        writeReg(0x40, 0x83)
        writeReg(0x46, 0x25)
        writeReg(0x60, 0x00)
        writeReg(0x27, 0x00)
        writeReg(0x50, 0x06)
        writeReg(0x51, 0x00)
        writeReg(0x52, 0x96)
        writeReg(0x56, 0x08)
        writeReg(0x57, 0x30)
        writeReg(0x61, 0x00)
        writeReg(0x62, 0x00)
        writeReg(0x64, 0x00)
        writeReg(0x65, 0x00)
        writeReg(0x66, 0xA0)

        writeReg(0xFF, 0x01)
        writeReg(0x22, 0x32)
        writeReg(0x47, 0x14)
        writeReg(0x49, 0xFF)
        writeReg(0x4A, 0x00)

        writeReg(0xFF, 0x00)
        writeReg(0x7A, 0x0A)
        writeReg(0x7B, 0x00)
        writeReg(0x78, 0x21)

        writeReg(0xFF, 0x01)
        writeReg(0x23, 0x34)
        writeReg(0x42, 0x00)
        writeReg(0x44, 0xFF)
        writeReg(0x45, 0x26)
        writeReg(0x46, 0x05)
        writeReg(0x40, 0x40)
        writeReg(0x0E, 0x06)
        writeReg(0x20, 0x1A)
        writeReg(0x43, 0x40)

        writeReg(0xFF, 0x00)
        writeReg(0x34, 0x03)
        writeReg(0x35, 0x44)

        writeReg(0xFF, 0x01)
        writeReg(0x31, 0x04)
        writeReg(0x4B, 0x09)
        writeReg(0x4C, 0x05)
        writeReg(0x4D, 0x04)

        writeReg(0xFF, 0x00)
        writeReg(0x44, 0x00)
        writeReg(0x45, 0x20)
        writeReg(0x47, 0x08)
        writeReg(0x48, 0x28)
        writeReg(0x67, 0x00)
        writeReg(0x70, 0x04)
        writeReg(0x71, 0x01)
        writeReg(0x72, 0xFE)
        writeReg(0x76, 0x00)
        writeReg(0x77, 0x00)

        writeReg(0xFF, 0x01)
        writeReg(0x0D, 0x01)

        writeReg(0xFF, 0x00)
        writeReg(0x80, 0x01)
        writeReg(0x01, 0xF8)

        writeReg(0xFF, 0x01)
        writeReg(0x8E, 0x01)
        writeReg(0x00, 0x01)
        writeReg(0xFF, 0x00)
        writeReg(0x80, 0x00)

        writeReg(INTERRUPT_GPIO, 0x04)
        writeFlag(GPIO_MUX_ACTIVE_HIGH, 4, false)
        writeReg(INTERRUPT_CLEAR, 0x01)

        writeReg(SYSTEM_SEQUENCE, 0x01)
        if (!calibrate(0x40))
            return
        writeReg(SYSTEM_SEQUENCE, 0x02)
        if (!calibrate(0x00))
            return
        writeReg(SYSTEM_SEQUENCE, 0xe8)

        return
    }

    function spad_info(): boolean {
        writeReg(0x80, 0x01)
        writeReg(0xff, 0x01)
        writeReg(0x00, 0x00)
        writeReg(0xff, 0x06)

        writeFlag(0x83, 3, true)
        writeReg(0xff, 0x07)
        writeReg(0x81, 0x01)
        writeReg(0x80, 0x01)
        writeReg(0x94, 0x6b)
        writeReg(0x83, 0x00)

        let timeout = 0
        while (readReg(0x83) == 0) {
            timeout++
            basic.pause(1)
            if (timeout == IO_TIMEOUT)
                return false
        }

        writeReg(0x83, 0x01)
        let value = readReg(0x92)
        writeReg(0x81, 0x00)
        writeReg(0xff, 0x06)

        writeFlag(0x83, 3, false)

        writeReg(0xff, 0x01)
        writeReg(0x00, 0x01)

        writeReg(0xff, 0x00)
        writeReg(0x80, 0x00)

        spad_count = value & 0x7f
        is_aperture = ((value & 0b10000000) == 0b10000000)
        return true
    }

    function calibrate(val: number): boolean {
        writeReg(SYSRANGE_START, 0x01 | val)
        let timeout = 0
        while ((readReg(RESULT_INTERRUPT_STATUS) & 0x07) == 0) {
            timeout++
            basic.pause(1)
            if (timeout == IO_TIMEOUT)
                return false
        }

        writeReg(INTERRUPT_CLEAR, 0x01)
        writeReg(SYSRANGE_START, 0x00)
        return true
    }

    function startContinous(period: number = 0): void {
        writeReg(0x80, 0x01)
        writeReg(0xFF, 0x01)
        writeReg(0x00, 0x00)
        writeReg(0x91, stop_variable)
        writeReg(0x00, 0x01)
        writeReg(0xFF, 0x00)
        writeReg(0x80, 0x00)
        let oscilator = 0
        if (period)
            oscilator = readReg16(OSC_CALIBRATE)
        if (oscilator) {
            period *= oscilator
            writeReg16(MEASURE_PERIOD, (period >> 16) & 0xffff)
            pins.i2cWriteNumber(i2cAddr, period & 0xffff, NumberFormat.UInt16BE, false)
            writeReg(SYSRANGE_START, 0x04)
        } else {
            writeReg(SYSRANGE_START, 0x02)
        }
        started = true
    }

    function stopContinous(): void {
        writeReg(SYSRANGE_START, 0x01)
        writeReg(0xFF, 0x01)
        writeReg(0x00, 0x00)
        writeReg(0x91, stop_variable)
        writeReg(0x00, 0x01)
        writeReg(0xFF, 0x00)
        started = false
    }

    function readContinousDistance(): number {
        let timeout = 0
        while ((readReg(RESULT_INTERRUPT_STATUS) & 0x07) == 0) {
            timeout++
            basic.pause(1)
            if (timeout == IO_TIMEOUT)
                return 0
        }
        let value = readReg16(RESULT_RANGE_STATUS + 10)
        writeReg(INTERRUPT_CLEAR, 0x01)
        return value
    }

    function readSingleDistance(): number {
        let timeout = 0
        if (!started) {
            writeReg(0x80, 0x01)
            writeReg(0xFF, 0x01)
            writeReg(0x00, 0x00)
            writeReg(0x91, stop_variable)
            writeReg(0x00, 0x01)
            writeReg(0xFF, 0x00)
            writeReg(0x80, 0x00)
            writeReg(SYSRANGE_START, 0x01)
            while (readReg(SYSRANGE_START) & 0x01) {
                timeout++
                basic.pause(1)
                if (timeout == IO_TIMEOUT)
                    return 0
            }
        }

        timeout = 0
        while ((readReg(RESULT_INTERRUPT_STATUS) & 0x07) == 0) {
            timeout++
            basic.pause(1)
            if (timeout == IO_TIMEOUT)
                return 0
        }

        let value = readReg16(RESULT_RANGE_STATUS + 10)
        writeReg(INTERRUPT_CLEAR, 0x01)
        return value
    }
    function stringDistance(): string {
        let d = readSingleDistance()
        let d1 = Math.floor(d / 10)
        let d2 = Math.floor(d - (d1 * 10))
        let s = `${d1}` + '.' + `${d2}` + " cm "
        return s
    }
    /**
     * ToFセンサの距離値（cm）を取得する。
     */
    //% block="ToFセンサ（cm）"
    //% weight=81
    export function tof_value(): number {
        init();
        basic.pause(100);
        文字列の長さ = stringDistance().length;
        if (文字列の長さ == 7) {
            物体までの距離 = parseFloat(stringDistance().substr(0, 3));
        } else if (文字列の長さ == 8) {
            物体までの距離 = parseFloat(stringDistance().substr(0, 4));
        } else if (文字列の長さ == 9) {
            物体までの距離 = parseFloat(stringDistance().substr(0, 5));
        }
        return 物体までの距離;
    }
    /**
     * 右サーボを停止させる。
     */
    //% block
    //% weight=82
    export function 右サーボ停止(): void {
        pins.servoWritePin(AnalogPin.P1, 90);
    }
    /**
     * 右サーボを指定された速度で後ろに回転させる。
     * @param speed The speed for the servo, eg: 1,3
     */
    //% block="右サーボ後ろ回転 速度 %speed"
    //% speed.min=1 speed.max=8 speed.defl=1
    //% weight=83
    export function 右サーボ後ろ回転速度(speed: number): void {
        switch (speed) {
            case 1: pins.servoSetPulse(AnalogPin.P1, 1550); break;
            case 2: pins.servoSetPulse(AnalogPin.P1, 1650); break;
            case 3: pins.servoSetPulse(AnalogPin.P1, 1750); break;
            case 4: pins.servoSetPulse(AnalogPin.P1, 1850); break;
            case 5: pins.servoSetPulse(AnalogPin.P1, 1950); break;
            case 6: pins.servoSetPulse(AnalogPin.P1, 2050); break;
            case 7: pins.servoSetPulse(AnalogPin.P1, 2150); break;
            case 8: pins.servoSetPulse(AnalogPin.P1, 2250); break;
        }
    }
    /**
     * 右サーボを指定された速度で前に回転させる。
     * @param speed The speed for the servo, eg: 1,3
     */
    //% block="右サーボ前回転 速度 %speed"
    //% speed.min=1 speed.max=8 speed.defl=1
    //% weight=84
    export function 右サーボ前回転速度(speed: number): void {
        switch (speed) {
            case 1: pins.servoSetPulse(AnalogPin.P1, 1410); break;
            case 2: pins.servoSetPulse(AnalogPin.P1, 1310); break;
            case 3: pins.servoSetPulse(AnalogPin.P1, 1210); break;
            case 4: pins.servoSetPulse(AnalogPin.P1, 1110); break;
            case 5: pins.servoSetPulse(AnalogPin.P1, 1010); break;
            case 6: pins.servoSetPulse(AnalogPin.P1, 910); break;
            case 7: pins.servoSetPulse(AnalogPin.P1, 810); break;
            case 8: pins.servoSetPulse(AnalogPin.P1, 710); break;
        }
    }
    /**
     * 左サーボを停止させる。
     */
    //% block
    //% weight=85
    export function 左サーボ停止(): void {
        pins.servoWritePin(AnalogPin.P2, 90);
    }
    /**
     * 左サーボを指定された速度で後ろに回転させる。
     * @param speed The speed for the servo, eg: 1,3
     */
    //% block="左サーボ後ろ回転 速度 %speed"
    //% speed.min=1 speed.max=8 speed.defl=1
    //% weight=86
    export function 左サーボ後ろ回転速度(speed: number): void {
        switch (speed) {
            case 1: pins.servoSetPulse(AnalogPin.P2, 1410); break;
            case 2: pins.servoSetPulse(AnalogPin.P2, 1310); break;
            case 3: pins.servoSetPulse(AnalogPin.P2, 1210); break;
            case 4: pins.servoSetPulse(AnalogPin.P2, 1110); break;
            case 5: pins.servoSetPulse(AnalogPin.P2, 1010); break;
            case 6: pins.servoSetPulse(AnalogPin.P2, 910); break;
            case 7: pins.servoSetPulse(AnalogPin.P2, 810); break;
            case 8: pins.servoSetPulse(AnalogPin.P2, 710); break;
        }
    }
    /**
     * 左サーボを指定された速度で前に回転させる。
     * @param speed The speed for the servo, eg: 1,3
     */
    //% block="左サーボ前回転 速度 %speed"
    //% speed.min=1 speed.max=8 speed.defl=1
    //% weight=87
    export function 左サーボ前回転速度(speed: number): void {
        switch (speed) {
            case 1: pins.servoSetPulse(AnalogPin.P2, 1550); break;
            case 2: pins.servoSetPulse(AnalogPin.P2, 1650); break;
            case 3: pins.servoSetPulse(AnalogPin.P2, 1750); break;
            case 4: pins.servoSetPulse(AnalogPin.P2, 1850); break;
            case 5: pins.servoSetPulse(AnalogPin.P2, 1950); break;
            case 6: pins.servoSetPulse(AnalogPin.P2, 2050); break;
            case 7: pins.servoSetPulse(AnalogPin.P2, 2150); break;
            case 8: pins.servoSetPulse(AnalogPin.P2, 2250); break;
        }
    }
    /**
     * 巻き取りサーボを停止させる。
     */
    //% block
    //% weight=88
    export function 巻き取りサーボ停止(): void {
        pins.servoWritePin(AnalogPin.P8, 90);
    }
    /**
     * 巻き取りサーボを指定された速度で下に回転させる。
     * @param speed The speed for the servo, eg: 1,3
     */
    //% block="巻き取りサーボ下回転 速度 %speed"
    //% speed.min=1 speed.max=8 speed.defl=1
    //% weight=89
    export function 巻き取りサーボ下回転速度(speed: number): void {
        switch (speed) {
            case 1: pins.servoSetPulse(AnalogPin.P8, 1510); break;
            case 2: pins.servoSetPulse(AnalogPin.P8, 1530); break;
            case 3: pins.servoSetPulse(AnalogPin.P8, 1550); break;
            case 4: pins.servoSetPulse(AnalogPin.P8, 1570); break;
            case 5: pins.servoSetPulse(AnalogPin.P8, 1590); break;
            case 6: pins.servoSetPulse(AnalogPin.P8, 1610); break;
            case 7: pins.servoSetPulse(AnalogPin.P8, 1630); break;
            case 8: pins.servoSetPulse(AnalogPin.P8, 1650); break;
        }
    }
    /**
     * 巻き取りサーボを指定された速度で上に回転させる。
     * @param speed The speed for the servo, eg: 1,3
     */
    //% block="巻き取りサーボ上回転 速度 %speed"
    //% speed.min=1 speed.max=8 speed.defl=1
    //% weight=90
    export function 巻き取りサーボ上回転速度(speed: number): void {
        switch (speed) {
            case 1: pins.servoSetPulse(AnalogPin.P8, 1450); break;
            case 2: pins.servoSetPulse(AnalogPin.P8, 1430); break;
            case 3: pins.servoSetPulse(AnalogPin.P8, 1410); break;
            case 4: pins.servoSetPulse(AnalogPin.P8, 1390); break;
            case 5: pins.servoSetPulse(AnalogPin.P8, 1370); break;
            case 6: pins.servoSetPulse(AnalogPin.P8, 1350); break;
            case 7: pins.servoSetPulse(AnalogPin.P8, 1330); break;
            case 8: pins.servoSetPulse(AnalogPin.P8, 1310); break;
        }
    }

    /**
     * 
     * HuskyLensの拡張機能用
     * 
     */
    // let protocolPtr: number[][] = [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0]]
    // let Protocol_t: number[] = [0, 0, 0, 0, 0, 0]
    // let i = 1;
    // let FRAME_BUFFER_SIZE = 128
    // let HEADER_0_INDEX = 0
    // let HEADER_1_INDEX = 1
    // let ADDRESS_INDEX = 2
    // let CONTENT_SIZE_INDEX = 3
    // let COMMAND_INDEX = 4
    // let CONTENT_INDEX = 5
    // let PROTOCOL_SIZE = 6
    // let send_index = 0;
    // let receive_index = 0;

    // let COMMAND_REQUEST = 0x20;

    // let receive_buffer: number[] = [];
    // let send_buffer: number[] = [];
    // let buffer: number[] = [];

    // let send_fail = false;
    // let receive_fail = false;
    // let content_current = 0;
    // let content_end = 0;
    // let content_read_end = false;

    // let command: number
    // let content: number


    // //% advanced=true shim=i2c::init
    // function huskylens_init(): void {
    //     return;
    // }

    // /**
    //  * AIカメラは成功するまでI2Cを初期化する。
    //  */
    // //% block="AIカメラは成功するまでI2C初期化"
    // //% weight=45
    // export function initI2c(): void {
    //     huskylens_init();
    //     while (!readKnock());

    //     yes();
    // }
    // /**
    //  * AIカメラは成功するまでモードを変更する。
    //  */
    // //% block="AIカメラは %mode にアルゴリズムを切りかえる"
    // //% weight=40
    // export function initMode(mode: protocolAlgorithm) {
    //     writeAlgorithm(mode, protocolCommand.COMMAND_REQUEST_ALGORITHM)
    //     while (!wait(protocolCommand.COMMAND_RETURN_OK));
    //     yes();
    // }
    // /**
    //  * AIカメラはデータを要求し、結果にかくのうする。
    //  */
    // //% block="AIカメラは１度データを要求し、結果に保存する"
    // //% weight=35
    // export function request(): void {
    //     protocolWriteCommand(protocolCommand.COMMAND_REQUEST)
    //     processReturn();
    // }
    // /**
    //  * AIカメラは結果から学習したIDの数を得る。
    //  */
    // //% block="AIカメラは結果から学習したIDの合計数を得る"
    // //% weight=34
    // export function getIds(): number {
    //     return Protocol_t[2];
    // }
    // /**
    //  * AIカメラが結果から得たわくや矢印が画面に表示される？
    //  */
    // //% block="AIカメラは結果から %Ht が画面上にあるかどうかをかくにんする"
    // //% weight=33
    // export function isAppear_s(Ht: HUSKYLENSResultType_t): boolean {
    //     switch (Ht) {
    //         case 1:
    //             return countBlocks_s() != 0 ? true : false;
    //         case 2:
    //             return countArrows_s() != 0 ? true : false;
    //         default:
    //             return false;
    //     }
    // }
    // /**
    //  * AIカメラは結果から画面中央付近のわくのパラメータを取得する。
    //  */
    // //% block="AIカメラは結果から画面中央付近のわくの %data を取得する"
    // //% weight=32
    // export function readBox_s(data: Content3): number {
    //     let hk_x
    //     let hk_y = readBlockCenterParameterDirect();
    //     if (hk_y != -1) {
    //         switch (data) {
    //             case 1:
    //                 hk_x = protocolPtr[hk_y][1]; break;
    //             case 2:
    //                 hk_x = protocolPtr[hk_y][2]; break;
    //             case 3:
    //                 hk_x = protocolPtr[hk_y][3]; break;
    //             case 4:
    //                 hk_x = protocolPtr[hk_y][4]; break;
    //             default:
    //                 hk_x = protocolPtr[hk_y][5];
    //         }
    //     }
    //     else hk_x = -1
    //     return hk_x;
    // }
    // /**
    //  * AIカメラは結果から画面中央付近の矢印のパラメータを取得する。
    //  */
    // //% block="AIカメラは結果から画面中央付近の矢印の %data を取得する"
    // //% weight=32
    // export function readArrow_s(data: Content4): number {
    //     let hk_x
    //     let hk_y = readArrowCenterParameterDirect()
    //     if (hk_y != -1) {
    //         switch (data) {
    //             case 1:
    //                 hk_x = protocolPtr[hk_y][1]; break;
    //             case 2:
    //                 hk_x = protocolPtr[hk_y][2]; break;
    //             case 3:
    //                 hk_x = protocolPtr[hk_y][3]; break;
    //             case 4:
    //                 hk_x = protocolPtr[hk_y][4]; break;
    //             default:
    //                 hk_x = protocolPtr[hk_y][5];
    //         }
    //     } else hk_x = -1
    //     return hk_x;
    // }
    // /**
    //  * AIカメラが結果から得たIDは以前に学んだことがある？
    //  * @param id to id ,eg: 1
    //  */
    // //% block="AIカメラは結果からID %id が学習されたかどうかをかくにんする"
    // //% weight=31
    // export function isLearned(id: number): boolean {
    //     let hk_x = countLearnedIDs();
    //     if (id <= hk_x) return true;
    //     return false;
    // }
    // /**
    //  * 結果からAIカメラが取得したIDに対応する枠または矢印が画面に表示される？
    //  * @param id to id ,eg: 1
    //  */
    // //% block="AIカメラは結果からID %id %Htが画面に表示されているかどうかをかくにんする"
    // //% weight=30
    // export function isAppear(id: number, Ht: HUSKYLENSResultType_t): boolean {
    //     switch (Ht) {
    //         case 1:
    //             return countBlocks(id) != 0 ? true : false;
    //         case 2:
    //             return countArrows(id) != 0 ? true : false;
    //         default:
    //             return false;
    //     }
    // }
    // /**
    //  * AIカメラは結果からIDに対応するわくのパラメータを取得する。
    //  * @param id to id ,eg: 1
    //  */
    // //% block="AIカメラは結果からID $id わくの $number1 を取得する"
    // //% weight=25
    // export function readeBox(id: number, number1: Content1): number {
    //     let hk_y = cycle_block(id, 1);
    //     let hk_x
    //     if (countBlocks(id) != 0) {
    //         if (hk_y != null) {
    //             switch (number1) {
    //                 case 1:
    //                     hk_x = protocolPtr[hk_y][1]; break;
    //                 case 2:
    //                     hk_x = protocolPtr[hk_y][2]; break;
    //                 case 3:
    //                     hk_x = protocolPtr[hk_y][3]; break;
    //                 case 4:
    //                     hk_x = protocolPtr[hk_y][4]; break;
    //             }
    //         }
    //         else hk_x = -1;
    //     }
    //     else hk_x = -1;
    //     return hk_x;
    // }
    // /**
    // * AIカメラは結果からIDに対応する矢印のパラメータを取得する。
    // * @param id to id ,eg: 1
    // */
    // //% block="AIカメラは結果からID $id 矢印の $number1 を取得する"
    // //% weight=20
    // export function readeArrow(id: number, number1: Content2): number {
    //     let hk_y = cycle_arrow(id, 1);
    //     let hk_x
    //     if (countArrows(id) != 0) {
    //         if (hk_y != null) {

    //             switch (number1) {
    //                 case 1:
    //                     hk_x = protocolPtr[hk_y][1]; break;
    //                 case 2:
    //                     hk_x = protocolPtr[hk_y][2]; break;
    //                 case 3:
    //                     hk_x = protocolPtr[hk_y][3]; break;
    //                 case 4:
    //                     hk_x = protocolPtr[hk_y][4]; break;
    //                 default:
    //                     hk_x = -1;
    //             }
    //         }
    //         else hk_x = -1;
    //     }
    //     else hk_x = -1;
    //     return hk_x;
    // }
    // /**
    //  * AIカメラは結果からわくまたは矢印の合計数を取得する。
    //  * 
    //  */
    // //% block="AIカメラは結果から %Ht の合計数を取得する"
    // //% weight=45
    // //% advanced=true
    // export function getBox(Ht: HUSKYLENSResultType_t): number {
    //     switch (Ht) {
    //         case 1:
    //             return countBlocks_s();
    //         case 2:
    //             return countArrows_s();
    //         default:
    //             return 0;
    //     }
    // }
    // /**
    //  * AIカメラは結果からＮ番目のわくのパラメータを取得する。
    //  * @param index to index ,eg: 1
    //  */
    // //% block="AIカメラは結果から $index 番目のわくの $data を取得する"
    // //% weight=20
    // //% advanced=true
    // export function readBox_ss(index: number, data: Content3): number {
    //     let hk_x = -1
    //     let hk_i = index - 1
    //     if (protocolPtr[hk_i][0] == protocolCommand.COMMAND_RETURN_BLOCK) {
    //         switch (data) {
    //             case 1:
    //                 hk_x = protocolPtr[hk_i][1]; break;
    //             case 2:
    //                 hk_x = protocolPtr[hk_i][2]; break;
    //             case 3:
    //                 hk_x = protocolPtr[hk_i][3]; break;
    //             case 4:
    //                 hk_x = protocolPtr[hk_i][4]; break;
    //             default:
    //                 hk_x = protocolPtr[hk_i][5];
    //         }
    //     } else hk_x = -1;
    //     return hk_x;

    // }
    // /**
    //  * AIカメラは結果からＮ番目の矢印のパラメータを取得する。
    //  * @param index to index ,eg: 1
    // */
    // //% block="AIカメラは結果から$index番目の矢印の$dataを取得する"
    // //% weight=20
    // //% advanced=true
    // export function readArrow_ss(index: number, data: Content4): number {
    //     let hk_x
    //     let hk_i = index - 1
    //     if (protocolPtr[hk_i][0] == protocolCommand.COMMAND_RETURN_ARROW) {
    //         switch (data) {
    //             case 1:
    //                 hk_x = protocolPtr[hk_i][1]; break;
    //             case 2:
    //                 hk_x = protocolPtr[hk_i][2]; break;
    //             case 3:
    //                 hk_x = protocolPtr[hk_i][3]; break;
    //             case 4:
    //                 hk_x = protocolPtr[hk_i][4]; break;
    //             default:
    //                 hk_x = protocolPtr[hk_i][5];
    //         }
    //     } else hk_x = -1;
    //     //protocolPtr[hk_i][0] = 0;
    //     return hk_x;
    // }
    // /**
    //  * AIカメラは結果からわくまたは矢印の合計数を取得する。
    //  * @param id to id ,eg: 1
    //  */
    // //% block="AIカメラは結果からID %id %Ht の合計数を取得する"
    // //% weight=14
    // //% advanced=true
    // export function getBox_S(id: number, Ht: HUSKYLENSResultType_t): number {
    //     switch (Ht) {
    //         case 1:
    //             return countBlocks(id);
    //         case 2:
    //             return countArrows(id);
    //         default:
    //             return 0;
    //     }
    // }
    // /**
    //  * AIカメラは結果からIDに対応したＮ番目のわくのパラメータを取得する。
    //  * @param id to id ,eg: 1
    //  * @param index to index ,eg: 1
    //  */
    // //% block="AIカメラは結果からID $id番号 $indexわくの $number1 を取得する"
    // //% weight=13
    // //% advanced=true
    // export function readeBox_index(id: number, index: number, number1: Content1): number {
    //     let hk_y = cycle_block(id, index);
    //     let hk_x
    //     if (countBlocks(id) != 0) {
    //         if (hk_y != null) {
    //             switch (number1) {
    //                 case 1:
    //                     hk_x = protocolPtr[hk_y][1]; break;
    //                 case 2:
    //                     hk_x = protocolPtr[hk_y][2]; break;
    //                 case 3:
    //                     hk_x = protocolPtr[hk_y][3]; break;
    //                 case 4:
    //                     hk_x = protocolPtr[hk_y][4]; break;
    //                 default:
    //                     hk_x = -1;
    //             }
    //         }
    //         else hk_x = -1;
    //     }
    //     else hk_x = -1;
    //     return hk_x;
    // }
    // /**
    //  * AIカメラは結果からIDに対応するＮ番目の矢印のパラメータを取得する。
    //  * @param id to id ,eg: 1
    //  * @param index to index ,eg: 1
    //  */
    // //% block="AIカメラは結果からID $id 番号 $index 矢印の $number1 を取得する"
    // //% weight=12
    // //% advanced=true
    // export function readeArrow_index(index: number, id: number, number1: Content2): number {
    //     let hk_y = cycle_arrow(id, index);
    //     let hk_x
    //     if (countArrows(id) != 0) {
    //         if (hk_y != null) {
    //             switch (number1) {
    //                 case 1:
    //                     hk_x = protocolPtr[hk_y][1]; break;
    //                 case 2:
    //                     hk_x = protocolPtr[hk_y][2]; break;
    //                 case 3:
    //                     hk_x = protocolPtr[hk_y][3]; break;
    //                 case 4:
    //                     hk_x = protocolPtr[hk_y][4]; break;
    //                 default:
    //                     hk_x = -1;
    //             }
    //         }
    //         else hk_x = -1;
    //     }
    //     else hk_x = -1;
    //     return hk_x;
    // }
    // /**
    //  * AIカメラの自動学習ID
    //  * @param id to id ,eg: 1
    //  */
    // //% block="AIカメラはID %id を一度だけ自動的に学習する"
    // //% weight=11
    // //% advanced=true
    // export function writeLearn1(id: number): void {
    //     writeAlgorithm(id, 0X36)
    //     //while(!wait(protocolCommand.COMMAND_RETURN_OK));
    // }
    // /**
    //  * AIカメラは現在のアルゴリズムの学習データをすべて忘れる。
    //  */
    // //% block="AIカメラは現在のアルゴリズムの学習データをすべて忘れる"
    // //% weight=10
    // //% advanced=true
    // export function forgetLearn(): void {
    //     writeAlgorithm(0x47, 0X37)
    //     //while(!wait(protocolCommand.COMMAND_RETURN_OK));
    // }
    // /**
    //  * ID名の設定
    //  * @param id to id ,eg: 1
    //  * @param name to name ,eg: "DFRobot"
    //  */
    // //% block="AIカメラ名 ID %name として現在のアルゴリズムの %id"
    // //% weight=9
    // //% advanced=true
    // export function writeName(id: number, name: string): void {
    //     //do{
    //     let newname = name;
    //     let buffer = husky_lens_protocol_write_begin(0x2f);
    //     send_buffer[send_index] = id;
    //     send_buffer[send_index + 1] = (newname.length + 1) * 2;
    //     send_index += 2;
    //     for (let i = 0; i < newname.length; i++) {
    //         send_buffer[send_index] = newname.charCodeAt(i);
    //         //serial.writeNumber(newname.charCodeAt(i))
    //         send_index++;
    //     }
    //     send_buffer[send_index] = 0;
    //     send_index += 1;
    //     let length = husky_lens_protocol_write_end();
    //     let Buffer = pins.createBufferFromArray(buffer);
    //     protocolWrite(Buffer);
    //     //}while(!wait(protocolCommand.COMMAND_RETURN_OK));
    // }
    // /**
    //  * 画面に文字を表示する。
    //  * @param x to x ,eg: 150
    //  * @param y to y ,eg: 30
    //  * @param name to name ,eg: "DFRobot"
    //  */
    // //% block="AIカメラ画面上の x %x y %y の位置に文字列 %name を表示する"
    // //% weight=8
    // //% advanced=true
    // //% x.min=0 x.max=319
    // //% y.min=0 y.max=210
    // export function writeOSD(x: number, y: number, name: string): void {
    //     //do{
    //     let buffer = husky_lens_protocol_write_begin(0x34);
    //     send_buffer[send_index] = name.length;
    //     if (x > 255) {
    //         send_buffer[send_index + 2] = (x % 255);
    //         send_buffer[send_index + 1] = 0xff;
    //     } else {
    //         send_buffer[send_index + 1] = 0;
    //         send_buffer[send_index + 2] = x;
    //     }
    //     send_buffer[send_index + 3] = y;
    //     send_index += 4;
    //     for (let i = 0; i < name.length; i++) {
    //         send_buffer[send_index] = name.charCodeAt(i);
    //         //serial.writeNumber(name.charCodeAt(i));
    //         send_index++;
    //     }
    //     let length = husky_lens_protocol_write_end();
    //     //serial.writeNumber(length)
    //     let Buffer = pins.createBufferFromArray(buffer);
    //     protocolWrite(Buffer);
    //     //}while(!wait(protocolCommand.COMMAND_RETURN_OK));
    // }
    // /**
    //  * AIカメラは画面内の文字をクリアにする。
    //  */
    // //% block="AIカメラは画面上のすべての文字列をクリアにする"
    // //% weight=7
    // //% advanced=true
    // export function clearOSD(): void {
    //     writeAlgorithm(0x45, 0X35);
    //     //while(!wait(protocolCommand.COMMAND_RETURN_OK));
    // }
    // /**
    //  * AIカメラで写真とスクリーンショット
    //  */
    // //% block="AIカメラが %request を受け取り、SDカードに保存する"
    // //% weight=6
    // //% advanced=true
    // export function takePhotoToSDCard(request: HUSKYLENSphoto): void {
    //     switch (request) {
    //         case HUSKYLENSphoto.PHOTO:
    //             writeAlgorithm(0x40, 0X30)
    //             //while(!wait(protocolCommand.COMMAND_RETURN_OK))
    //             break;
    //         case HUSKYLENSphoto.SCREENSHOT:
    //             writeAlgorithm(0x49, 0X39)
    //             //while(!wait(protocolCommand.COMMAND_RETURN_OK));
    //             break;
    //         default:
    //             writeAlgorithm(0x40, 0X30)
    //         //while(!wait(protocolCommand.COMMAND_RETURN_OK));
    //     }
    //     basic.pause(500)
    // }
    // /**
    //  * データモデルの保存
    //  */
    // //% block="AIカメラ %command は現在のアルゴリズムデータをSDカードの%data番目のモデルにする"
    // //% weight=5
    // //% advanced=true
    // //% data.min=0 data.max=5
    // export function saveModelToTFCard(command: HUSKYLENSMode, data: number): void {
    //     switch (command) {
    //         case HUSKYLENSMode.SAVE:
    //             writeAlgorithm(data, 0x32);
    //             //while(!wait(protocolCommand.COMMAND_RETURN_OK));
    //             break;
    //         case HUSKYLENSMode.LOAD:
    //             writeAlgorithm(data, 0x33);
    //             //while(!wait(protocolCommand.COMMAND_RETURN_OK));
    //             break;
    //         default:
    //             writeAlgorithm(data, 0x32);
    //         //while(!wait(protocolCommand.COMMAND_RETURN_OK));
    //     }
    //     basic.pause(500)
    // }

    // function validateCheckSum() {

    //     let stackSumIndex = receive_buffer[3] + CONTENT_INDEX;
    //     let hk_sum = 0;
    //     for (let i = 0; i < stackSumIndex; i++) {
    //         hk_sum += receive_buffer[i];
    //     }
    //     hk_sum = hk_sum & 0xff;

    //     return (hk_sum == receive_buffer[stackSumIndex]);
    // }

    // function husky_lens_protocol_write_end() {
    //     if (send_fail) { return 0; }
    //     if (send_index + 1 >= FRAME_BUFFER_SIZE) { return 0; }
    //     send_buffer[CONTENT_SIZE_INDEX] = send_index - CONTENT_INDEX;
    //     //serial.writeValue("618", send_buffer[CONTENT_SIZE_INDEX])
    //     let hk_sum = 0;
    //     for (let i = 0; i < send_index; i++) {
    //         hk_sum += send_buffer[i];
    //     }

    //     hk_sum = hk_sum & 0xff;
    //     send_buffer[send_index] = hk_sum;
    //     send_index++;
    //     return send_index;
    // }

    // function husky_lens_protocol_write_begin(command = 0) {
    //     send_fail = false;
    //     send_buffer[HEADER_0_INDEX] = 0x55;
    //     send_buffer[HEADER_1_INDEX] = 0xAA;
    //     send_buffer[ADDRESS_INDEX] = 0x11;
    //     //send_buffer[CONTENT_SIZE_INDEX] = datalen;
    //     send_buffer[COMMAND_INDEX] = command;
    //     send_index = CONTENT_INDEX;
    //     return send_buffer;
    // }

    // function protocolWrite(buffer: Buffer) {
    //     pins.i2cWriteBuffer(0x32, buffer, false);
    //     basic.pause(50)
    // }

    // function processReturn() {
    //     if (!wait(protocolCommand.COMMAND_RETURN_INFO)) return false;
    //     protocolReadFiveInt16(protocolCommand.COMMAND_RETURN_INFO);
    //     for (let i = 0; i < Protocol_t[1]; i++) {

    //         if (!wait()) return false;
    //         if (protocolReadFiveInt161(i, protocolCommand.COMMAND_RETURN_BLOCK)) continue;
    //         else if (protocolReadFiveInt161(i, protocolCommand.COMMAND_RETURN_ARROW)) continue;
    //         else return false;
    //     }
    //     return true;
    // }

    // function wait(command = 0) {
    //     timerBegin();
    //     while (!timerAvailable()) {
    //         if (protocolAvailable()) {
    //             if (command) {
    //                 if (husky_lens_protocol_read_begin(command)) {
    //                     //serial.writeNumber(0);
    //                     return true;
    //                 }
    //             }
    //             else {
    //                 return true;
    //             }
    //         } else {
    //             return false;
    //         }
    //     }
    //     return false;
    // }

    // function husky_lens_protocol_read_begin(command = 0) {
    //     if (command == receive_buffer[COMMAND_INDEX]) {
    //         content_current = CONTENT_INDEX;
    //         content_read_end = false;
    //         receive_fail = false;
    //         return true;
    //     }
    //     return false;
    // }

    // let timeOutDuration = 100;
    // let timeOutTimer: number
    // function timerBegin() {
    //     timeOutTimer = input.runningTime();
    // }

    // function timerAvailable() {
    //     return (input.runningTime() - timeOutTimer > timeOutDuration);
    // }

    // let m_i = 16
    // function protocolAvailable() {
    //     let buf = pins.createBuffer(16)
    //     if (m_i == 16) {
    //         buf = pins.i2cReadBuffer(0x32, 16, false);
    //         m_i = 0;
    //     }
    //     for (let i = m_i; i < 16; i++) {
    //         if (husky_lens_protocol_receive(buf[i])) {
    //             m_i++;
    //             return true;
    //         }
    //         m_i++;
    //     }
    //     return false
    // }

    // function husky_lens_protocol_receive(data: number): boolean {
    //     switch (receive_index) {
    //         case HEADER_0_INDEX:
    //             if (data != 0x55) { receive_index = 0; return false; }
    //             receive_buffer[HEADER_0_INDEX] = 0x55;
    //             break;
    //         case HEADER_1_INDEX:
    //             if (data != 0xAA) { receive_index = 0; return false; }
    //             receive_buffer[HEADER_1_INDEX] = 0xAA;
    //             break;
    //         case ADDRESS_INDEX:
    //             receive_buffer[ADDRESS_INDEX] = data;
    //             break;
    //         case CONTENT_SIZE_INDEX:
    //             if (data >= FRAME_BUFFER_SIZE - PROTOCOL_SIZE) { receive_index = 0; return false; }
    //             receive_buffer[CONTENT_SIZE_INDEX] = data;
    //             break;
    //         default:
    //             receive_buffer[receive_index] = data;

    //             if (receive_index == receive_buffer[CONTENT_SIZE_INDEX] + CONTENT_INDEX) {
    //                 content_end = receive_index;
    //                 receive_index = 0;
    //                 return validateCheckSum();

    //             }
    //             break;
    //     }
    //     receive_index++;
    //     return false;
    // }

    // function husky_lens_protocol_write_int16(content = 0) {

    //     let x: number = ((content.toString()).length)
    //     if (send_index + x >= FRAME_BUFFER_SIZE) { send_fail = true; return; }
    //     send_buffer[send_index] = content & 0xff;
    //     send_buffer[send_index + 1] = (content >> 8) & 0xff;
    //     send_index += 2;
    // }

    // function protocolReadFiveInt16(command = 0) {
    //     if (husky_lens_protocol_read_begin(command)) {
    //         Protocol_t[0] = command;
    //         Protocol_t[1] = husky_lens_protocol_read_int16();
    //         Protocol_t[2] = husky_lens_protocol_read_int16();
    //         Protocol_t[3] = husky_lens_protocol_read_int16();
    //         Protocol_t[4] = husky_lens_protocol_read_int16();
    //         Protocol_t[5] = husky_lens_protocol_read_int16();
    //         husky_lens_protocol_read_end();
    //         return true;
    //     }
    //     else {
    //         return false;
    //     }
    // }

    // function protocolReadFiveInt161(i: number, command = 0) {
    //     if (husky_lens_protocol_read_begin(command)) {
    //         protocolPtr[i][0] = command;
    //         protocolPtr[i][1] = husky_lens_protocol_read_int16();
    //         protocolPtr[i][2] = husky_lens_protocol_read_int16();
    //         protocolPtr[i][3] = husky_lens_protocol_read_int16();
    //         protocolPtr[i][4] = husky_lens_protocol_read_int16();
    //         protocolPtr[i][5] = husky_lens_protocol_read_int16();
    //         husky_lens_protocol_read_end();
    //         return true;
    //     }
    //     else {
    //         return false;
    //     }
    // }

    // function husky_lens_protocol_read_int16() {
    //     if (content_current >= content_end || content_read_end) { receive_fail = true; return 0; }
    //     let result = receive_buffer[content_current + 1] << 8 | receive_buffer[content_current];
    //     content_current += 2
    //     return result;
    // }

    // function husky_lens_protocol_read_end() {
    //     if (receive_fail) {
    //         receive_fail = false;
    //         return false;
    //     }
    //     return content_current == content_end;
    // }

    // function countLearnedIDs() {
    //     return Protocol_t[2]
    // }

    // function countBlocks(ID: number) {
    //     let counter = 0;
    //     for (let i = 0; i < Protocol_t[1]; i++) {
    //         if (protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_BLOCK && protocolPtr[i][5] == ID) counter++;
    //     }
    //     return counter;
    // }

    // function countBlocks_s() {
    //     let counter = 0;
    //     for (let i = 0; i < Protocol_t[1]; i++) {
    //         if (protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_BLOCK) counter++;
    //     }
    //     //serial.writeNumber(counter)
    //     return counter;
    // }

    // function countArrows(ID: number) {
    //     let counter = 0;
    //     for (let i = 0; i < Protocol_t[1]; i++) {
    //         if (protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_ARROW && protocolPtr[i][5] == ID) counter++;
    //     }
    //     return counter;
    // }

    // function countArrows_s() {
    //     let counter = 0;
    //     for (let i = 0; i < Protocol_t[1]; i++) {
    //         if (protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_ARROW) counter++;
    //     }
    //     return counter;
    // }

    // function readKnock() {
    //     for (let i = 0; i < 5; i++) {
    //         protocolWriteCommand(protocolCommand.COMMAND_REQUEST_KNOCK);//I2C
    //         if (wait(protocolCommand.COMMAND_RETURN_OK)) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    // function writeForget() {
    //     for (let i = 0; i < 5; i++) {
    //         protocolWriteCommand(protocolCommand.COMMAND_REQUEST_FORGET);
    //         if (wait(protocolCommand.COMMAND_RETURN_OK)) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    // function protocolWriteCommand(command = 0) {
    //     Protocol_t[0] = command;
    //     let buffer = husky_lens_protocol_write_begin(Protocol_t[0]);
    //     let length = husky_lens_protocol_write_end();
    //     let Buffer = pins.createBufferFromArray(buffer);
    //     protocolWrite(Buffer);
    // }

    // function protocolReadCommand(command = 0) {
    //     if (husky_lens_protocol_read_begin(command)) {
    //         Protocol_t[0] = command;
    //         husky_lens_protocol_read_end();
    //         return true;
    //     }
    //     else {
    //         return false;
    //     }
    // }

    // function writeAlgorithm(algorithmType: number, comemand = 0) {
    //     protocolWriteOneInt16(algorithmType, comemand);
    //     //return true//wait(protocolCommand.COMMAND_RETURN_OK);
    //     //while(!wait(protocolCommand.COMMAND_RETURN_OK));
    //     //return true
    // }

    // function writeLearn(algorithmType: number) {
    //     protocolWriteOneInt16(algorithmType, protocolCommand.COMMAND_REQUEST_LEARN);
    //     return wait(protocolCommand.COMMAND_RETURN_OK);
    // }

    // function protocolWriteOneInt16(algorithmType: number, command = 0) {
    //     let buffer = husky_lens_protocol_write_begin(command);
    //     husky_lens_protocol_write_int16(algorithmType);
    //     let length = husky_lens_protocol_write_end();
    //     let Buffer = pins.createBufferFromArray(buffer);
    //     protocolWrite(Buffer);
    // }

    // function cycle_block(ID: number, index = 1): number {
    //     let counter = 0;
    //     for (let i = 0; i < Protocol_t[1]; i++) {
    //         if (protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_BLOCK && protocolPtr[i][5] == ID) {
    //             counter++;
    //             if (index == counter) return i;

    //         }
    //     }
    //     return null;
    // }

    // function cycle_arrow(ID: number, index = 1): number {
    //     let counter = 0;
    //     for (let i = 0; i < Protocol_t[1]; i++) {
    //         if (protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_ARROW && protocolPtr[i][5] == ID) {
    //             counter++;
    //             if (index == counter) return i;

    //         }
    //     }
    //     return null;
    // }

    // function readBlockCenterParameterDirect(): number {
    //     let distanceMinIndex = -1;
    //     let distanceMin = 65535;
    //     for (let i = 0; i < Protocol_t[1]; i++) {
    //         if (protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_BLOCK) {
    //             let distance = Math.round(Math.sqrt(Math.abs(protocolPtr[i][1] - 320 / 2))) + Math.round(Math.sqrt(Math.abs(protocolPtr[i][2] - 240 / 2)));
    //             if (distance < distanceMin) {
    //                 distanceMin = distance;
    //                 distanceMinIndex = i;
    //             }
    //         }
    //     }
    //     return distanceMinIndex
    // }

    // function readArrowCenterParameterDirect(): number {
    //     let distanceMinIndex = -1;
    //     let distanceMin = 65535;
    //     for (let i = 0; i < Protocol_t[1]; i++) {
    //         if (protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_ARROW) {
    //             let distance = Math.round(Math.sqrt(Math.abs(protocolPtr[i][1] - 320 / 2))) + Math.round(Math.sqrt(Math.abs(protocolPtr[i][2] - 240 / 2)));
    //             if (distance < distanceMin) {
    //                 distanceMin = distance;
    //                 distanceMinIndex = i;
    //             }
    //         }
    //     }
    //     return distanceMinIndex
    // }

    // function no(): void {
    //     basic.showIcon(IconNames.No);
    //     basic.pause(100);
    //     basic.clearScreen();
    //     basic.pause(100);
    // }
    // function yes(): void {
    //     basic.showIcon(IconNames.Yes);
    //     basic.pause(100);
    //     basic.clearScreen();
    // }
}