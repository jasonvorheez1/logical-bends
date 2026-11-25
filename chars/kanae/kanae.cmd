;-| Button Remapping |-----------------------------------------------------
; This section lets you remap the player's buttons (to easily change the
; button configuration). The format is:
;   old_button = new_button
; If new_button is left blank, the button cannot be pressed.
[Remap]
x = x
y = y
z = z
a = 
b = b
c = c
s =

;-| Default Values |-------------------------------------------------------
[Defaults]
; Default value for the "time" parameter of a Command. Minimum 1.
command.time = 15

; Default value for the "buffer.time" parameter of a Command. Minimum 1,
; maximum 30.
command.buffer.time = 1


;-| Single Button |---------------------------------------------------------
[Command]
name = "x"
command = x
time = 1

[Command]
name = "y"
command = y
time = 1

[Command]
name = "z"
command = z
time = 1

[Command]
name = "b"
command = b
time = 1

;-| Hold Dir |--------------------------------------------------------------
[Command]
name = "holdfwd";Required (do not remove)
command = /$F
time = 1

[Command]
name = "holdback";Required (do not remove)
command = /$B
time = 1

[Command]
name = "holdup" ;Required (do not remove)
command = /$U
time = 1

[Command]
name = "holddown";Required (do not remove)
command = /$D
time = 1

;-| Hold Button |----------------------------------------------------------
; Please define Anim 74140108 in your AIR file if AND ONLY IF you place these
; 7 Hold Button commands immediately after the 11 Single Button and Hold Dir
; commands at the very top of your CMD list, as demonstrated here.
; In this version of the AI code, these commands are only used by the XOR
; method, and thus are optional.  But there remains a possibility that a
; future version of the helper method might be helped by having these
; commands placed here, and Anim 74140108 would then be used to indicate
; that a partner character has a compatible CMD.

[Command]
name = "holdb"
command = /b
time = 1

[Command]
name = "holdx"
command = /x
time = 1

[Command]
name = "holdy"
command = /y
time = 1

[Command]
name = "holdz"
command = /z
time = 1

;-| CPU |--------------------------------------------------------------
; Note that if you make any changes to the basic one-button or recovery
; commands, you'll need to make the same changes to their matching commands here
; and/or in the XOR VarSet controller.  That includes things like, for example:
;  * changing the recovery command to use a different combination of buttons.
;  * renaming the b button command as "d", or the start button command as "s".
;  * switching the button names around, e.g. so button y triggers "a" and button a triggers "y".
;  * having more than one way to trigger the same command name.
; If you understand how the XOR method works, the proper changes should be obvious.
; If you don't understand it, then simply disable the lines in the XOR VarSet
; controller that correspond to the commands you've altered.

[Command]
name = "b2"
command = b
time = 1

[Command]
name = "x2"
command = x
time = 1

[Command]
name = "y2"
command = y
time = 1

[Command]
name = "z2"
command = z
time = 1

[Command]
name = "holdfwd2"
command = /$F
time = 1

[Command]
name = "holdback2"
command = /$B
time = 1

[Command]
name = "holdup2"
command = /$U
time = 1

[Command]
name = "holddown2"
command = /$D
time = 1

[Command]
name = "holdb2"
command = /b
time = 1

[Command]
name = "holdx2"
command = /x
time = 1

[Command]
name = "holdy2"
command = /y
time = 1

[Command]
name = "holdz2"
command = /z
time = 1

;-| Super Motions |--------------------------------------------------------
;The following two have the same name, but different motion.
;Either one will be detected by a "command = TripleKFPalm" trigger.
;Time is set to 20 (instead of default of 15) to make the move
;easier to do.
;
[Command]
name = "QCF Super"
command = ~D, DF, F, y+z
time = 20
buffer.time = 5

[Command]
name = "QCB Super"
command = ~D, DB, B, y+z
time = 20
buffer.time = 5

[Command]
name = "DD Super"
command = D, ~$D, D, y+z
time = 20
buffer.time = 5

[Command]
name = "Finish"
command = x+y+z
time = 5
buffer.time = 15

[Command]
name = "Finish"
command = b
time = 5
buffer.time = 15

;-| Special Motions |------------------------------------------------------
[Command]
name = "QCFx"
command = ~D, DF, F, x
time = 15
buffer.time = 5

[Command]
name = "QCFy"
command = ~D, DF, F, y
time = 15
buffer.time = 5

[Command]
name = "QCFz"
command = ~D, DF, F, z
time = 15
buffer.time = 5

[Command]
name = "QCBx"
command = ~D, DB, B, x
time = 15
buffer.time = 5

[Command]
name = "QCBy"
command = ~D, DB, B, y
time = 15
buffer.time = 5

[Command]
name = "QCBz"
command = ~D, DB, B, z
time = 15
buffer.time = 5

[Command]
name = "DDx"
command = D, ~$D, D, x
time = 15
buffer.time = 5

[Command]
name = "DDy"
command = D, ~$D, D, y
time = 15
buffer.time = 5

[Command]
name = "DDz"
command = D, ~$D, D, z
time = 15
buffer.time = 5

;-| Double Tap |-----------------------------------------------------------
[Command]
name = "FF"     ;Required (do not remove)
command = F, F
time = 10

[Command]
name = "BB"     ;Required (do not remove)
command = B, B
time = 10

[Command]
name = "recovery";Required (do not remove)
command = x
time = 1
buffer.time = 5

[Command]
name = "recovery";Required (do not remove)
command = y
time = 1
buffer.time = 5

[Command]
name = "recovery";Required (do not remove)
command = z
time = 1
buffer.time = 5

[Command]
name = "throw"
command = x+y
time = 1

[Command]
name = "reflect"
command = y+z
time = 1
buffer.time = 2

[Command]
name = "xbuf"
command = x
time = 1
buffer.time = 5

[Command]
name = "ybuf"
command = y
time = 1
buffer.time = 5

[Command]
name = "zbuf"
command = z
time = 1
buffer.time = 7


; Don't remove the following line. It's required by the CMD standard.
[Statedef -1]

[State -1, AI Helper Check]
type = ChangeState
trigger1 = IsHelper(9741)
value = 9741

[State -1, AI Helper Check 2]
type = ChangeState
trigger1 = IsHelper(9742)
value = 9742

;===========================================================================
;---------------------------------------------------------------------------
[State -1, Reflect]
type = changestate
value = 160
triggerall = !var(0)
triggerall = command = "reflect"
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno = 400) || (stateno = [167,169]) || (stateno = 162)
trigger2 = var(2)

;---------------------------------------------------------------------------
;Throw Super
[State -1, Throw Super]
type = Changestate
value = 3000
triggerall = !var(0)
triggerall = command = "QCF Super"
triggerall = power >= 1000
triggerall = statetype = S || statetype = C
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno=400) || (stateno = 163)
trigger2 = var(2)
trigger3 = (stateno = [164,166])
trigger3 = time < 2

;---------------------------------------------------------------------------
;Counter Super
[State -1, Counter Super]
type = Changestate
value = 3050
triggerall = !var(0)
triggerall = command = "QCB Super"
triggerall = power >= 1000
triggerall = statetype = S || statetype = C
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno=400) || (stateno = 163)
trigger2 = var(2)
trigger3 = (stateno = [164,166])
trigger3 = time < 2

;---------------------------------------------------------------------------
;Anti-Air Super
[State -1, Anti-Air Super]
type = Changestate
value = 3100
triggerall = !var(0)
triggerall = command = "DD Super"
triggerall = power >= 1000
triggerall = statetype = S || statetype = C
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno=400) ||(stateno=1005)|| (stateno = 163)
trigger2 = var(2)
trigger3 = (stateno = [164,166])
trigger3 = time < 2

;---------------------------------------------------------------------------
;Super Part 2
[State -1, Super Part 2]
type = Changestate
value = 3150
triggerall = !var(0)
triggerall = command = "DD Super"
triggerall = power >= 1000
trigger1 = anim = 3002
trigger1 = animelemtime(13)>=0

;---------------------------------------------------------------------------
;Finale
[State -1, Finale]
type = changestate
value = 3200
triggerall = !var(0)
triggerall = command = "Finish"
triggerall = power >= 1000
trigger1 = anim = 3152
trigger1 = animelemtime(3) = [0,5]

;---------------------------------------------------------------------------
;Command Throw
[State -1, Command Throw]
type = Changestate
value = 1000
triggerall = !var(0)
triggerall = command = "QCFx"
triggerall = statetype = S || statetype = C
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno=400) || (stateno = 163)
trigger2 = var(2)

[State -1, Command Throw]
type = Changestate
value = 1001
triggerall = !var(0)
triggerall = command = "QCFy"
triggerall = statetype = S || statetype = C
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno=400) || (stateno = 163)
trigger2 = var(2)

[State -1, Command Throw]
type = Changestate
value = 1002
triggerall = !var(0)
triggerall = command = "QCFz"
triggerall = statetype = S || statetype = C
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno=400) || (stateno = 163)
trigger2 = var(2)

;---------------------------------------------------------------------------
;Anti Air Throw
[State -1, Anti Air Throw]
type = Changestate
value = 1100
triggerall = !var(0)
triggerall = command = "DDx"
triggerall = statetype = S || statetype = C
trigger1 = ctrl
trigger2 = (stateno = 200)||(stateno=400)||(stateno=1005) || (stateno = 163)
trigger2 = var(2)

[State -1, Anti Air Throw]
type = Changestate
value = 1101
triggerall = !var(0)
triggerall = command = "DDy"
triggerall = statetype = S || statetype = C
trigger1 = ctrl
trigger2 = (stateno = 200)||(stateno=400)||(stateno=1005) || (stateno = 163)
trigger2 = var(2)

[State -1, Anti Air Throw]
type = Changestate
value = 1102
triggerall = !var(0)
triggerall = command = "DDz"
triggerall = statetype = S || statetype = C
trigger1 = ctrl
trigger2 = (stateno = 200)||(stateno=400)||(stateno=1005) || (stateno = 163)
trigger2 = var(2)

;---------------------------------------------------------------------------
;Counter Throw
[State -1, Counter Throw]
type = Changestate
value = 1150
triggerall = !var(0)
triggerall = command = "QCBy"
triggerall = statetype = S || statetype = C
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno=400) || (stateno = 163)
trigger2 = var(2)

[State -1, Counter Throw]
type = Changestate
value = 1151
triggerall = !var(0)
triggerall = command = "QCBz"
triggerall = statetype = S || statetype = C
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno=400) || (stateno = 163)
trigger2 = var(2)

[State -1, Counter Throw]
type = Changestate
value = 1152
triggerall = !var(0)
triggerall = command = "QCBx"
triggerall = statetype = S || statetype = C
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno=400) || (stateno = 163)
trigger2 = var(2)

;---------------------------------------------------------------------------
;Dash Fwd
[State -1, Dash Fwd]
type = ChangeState
value = 100
triggerall = !var(0)
trigger1 = command = "FF"
trigger1 = statetype = S
trigger1 = ctrl

;---------------------------------------------------------------------------
;Hop Back
[State -1, Hop Back]
type = ChangeState
value = 105
triggerall = !var(0)
trigger1 = command = "BB"
trigger1 = statetype = S
trigger1 = ctrl

;---------------------------------------------------------------------------
[State -1, Air Throw]
type = Changestate
value = 815
triggerall = !var(0)
triggerall = command = "throw"
triggerall = command != "holddown"
trigger1 = ctrl
trigger1 = statetype = A

;---------------------------------------------------------------------------
[State -1, Normal Throw]
type = Changestate
value = 800 + 5*(command="holdfwd") + 10*(command="holdback")
triggerall = !var(0)
triggerall = command = "throw"
triggerall = command != "holddown"
trigger1 = ctrl
trigger1 = statetype = S

;---------------------------------------------------------------------------
;Forward C
[State -1, Forward C]
type = ChangeState
value = 230
triggerall = !var(0)
triggerall = command = "zbuf" && command = "holdfwd"
triggerall = command != "holddown"
trigger1 = command = "z" || time=1
trigger1 = statetype = S
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno = 400)
trigger2 = var(2)

;---------------------------------------------------------------------------
;Standing C
[State -1, Standing C]
type = ChangeState
value = 220
triggerall = !var(0)
triggerall = command = "z"
triggerall = command != "holddown"
trigger1 = statetype = S
trigger1 = ctrl

;---------------------------------------------------------------------------
;Standing B
[State -1, Standing B]
type = ChangeState
value = 210
triggerall = !var(0)
triggerall = command = "ybuf"
triggerall = command != "holddown"
trigger1 = command = "y" || time=1
trigger1 = statetype = S
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno = 400)
trigger2 = var(2)

;---------------------------------------------------------------------------
;Standing A
[State -1, Standing A]
type = ChangeState
value = 200
triggerall = !var(0)
triggerall = command = "xbuf"
triggerall = command != "holddown"
trigger1 = command = "x" || time=1
trigger1 = statetype = S
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno = 400)
trigger2 = var(2)

;---------------------------------------------------------------------------
;Roll
[State -1, Roll]
type = ChangeState
value = 430
triggerall = !var(0)
triggerall = command = "zbuf"
triggerall = command = "holddown" && command = "holdfwd"
trigger1 = command = "z" || time=1
trigger1 = statetype = C
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno = 400)
trigger2 = var(2)

;---------------------------------------------------------------------------
;Crouching C
[State -1, Crouching C]
type = ChangeState
value = 420
triggerall = !var(0)
triggerall = command = "z"
triggerall = command = "holddown"
trigger1 = statetype = C
trigger1 = ctrl

;---------------------------------------------------------------------------
;Crouching B
[State -1, Crouching B]
type = ChangeState
value = 410
triggerall = !var(0)
triggerall = command = "ybuf"
triggerall = command = "holddown"
trigger1 = command = "y" || time=1
trigger1 = statetype = C
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno = 400)
trigger2 = var(2)

;---------------------------------------------------------------------------
;Crouching A
[State -1, Crouching A]
type = ChangeState
value = 400
triggerall = !var(0)
triggerall = command = "xbuf"
triggerall = command = "holddown"
trigger1 = command = "x" || time=1
trigger1 = statetype = C
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno = 400)
trigger2 = var(2)

;---------------------------------------------------------------------------
;Boob Splash
[State -1, Boobs]
type = ChangeState
value = 640
triggerall = !var(0)
triggerall = command = "z" && command = "holddown"
trigger1 = statetype = A
trigger1 = ctrl

;---------------------------------------------------------------------------
;Neutral Jumping C
[State -1, Neutral Jumping C]
type = ChangeState
value = 620
triggerall = !var(0)
triggerall = command = "z"
triggerall = vel X = 0
trigger1 = statetype = A
trigger1 = ctrl

;---------------------------------------------------------------------------
;Jumping C
[State -1, Jumping C]
type = ChangeState
value = 630
triggerall = !var(0)
triggerall = command = "z"
triggerall = vel X != 0
trigger1 = statetype = A
trigger1 = ctrl

;---------------------------------------------------------------------------
;Jumping B
[State -1, Jumping B]
type = ChangeState
value = 610
triggerall = !var(0)
triggerall = command = "y"
trigger1 = statetype = A
trigger1 = ctrl

;---------------------------------------------------------------------------
;Jumping A
[State -1, Jumping A]
type = ChangeState
value = 600
triggerall = !var(0)
triggerall = command = "x"
trigger1 = statetype = A
trigger1 = ctrl

;===========================================================================
; AI DIRECTIVES
;===========================================================================

;---------------------------------------------------------------------------
;Attack Decider
[State -1, Random]
type = varset
trigger1 = 1
var(1) = random

;---------------------------------------------------------------------------
;Throw Super
[State -1, Throw Super]
type = Changestate
value = 3000
triggerall = var(0)
triggerall = power >= 1000
triggerall = statetype = S || statetype = C
triggerall = p2statetype = S || p2statetype = C
triggerall = p2bodydist X <= 40
triggerall = p2stateno != [120,159]
trigger1 = var(1) = [80, 93]
trigger1 = ctrl
trigger2 = var(1) = [80, 143]
trigger2 = ctrl
trigger2 = power = 3000
trigger2 = p2movetype = A
trigger3 = var(1) = [80, 143]
trigger3 = ctrl
trigger3 = numtarget
trigger3 = target, gethitvar(hitshaketime) >= 4
trigger4 = ctrl
trigger4 = prevstateno = 5120 || prevstateno = 5200
trigger4 = time = 1
trigger4 = p2movetype = A
trigger4 = p2statetype = S || p2statetype = C

;---------------------------------------------------------------------------
;Super Part 2
[State -1, Super Part 2]
type = Changestate
value = 3150
triggerall = var(0)
triggerall = power >= 2000
trigger1 = anim = 3002
trigger1 = animelemtime(13)>=10

;---------------------------------------------------------------------------
;Finale
[State -1, Finale]
type = changestate
value = 3200
triggerall = var(0)
triggerall = power >= 1000
trigger1 = anim = 3152
trigger1 = animelemtime(3) = 0

;---------------------------------------------------------------------------
;Command Throw
[State -1, Command Throw]
type = Changestate
value = 1000
triggerall = var(0)
triggerall = statetype != A
triggerall = p2bodydist X <= 48
triggerall = p2statetype = S || p2statetype = C
triggerall = p2stateno != [120,159]
trigger1 = var(1) = [80, 105]
trigger1 = ctrl
trigger2 = movehit  ; Guaranteed Link
trigger2 = p2bodydist X <= 40
trigger2 = (stateno = 200) || (stateno=400)
trigger2 = var(2)
trigger3 = movehit
trigger3 = ctrl
trigger3 = p2bodydist X <= 40
trigger4 = ctrl
trigger4 = numtarget
trigger4 = p2movetype = H
trigger5 = prevstateno = 52
trigger5 = time = 1
trigger5 = var(1) = [333,999]

;---------------------------------------------------------------------------
;Counter Super
[State -1, Counter Super]
type = Changestate
value = 3050
triggerall = var(0)
triggerall = power >= 1000
triggerall = statetype = S || statetype = C
triggerall = ctrl
triggerall = p2movetype = A
triggerall = enemy, time = [0,5]
triggerall = enemy, hitdefattr = SCA, NA,SA,HA
trigger1 = var(1) = [700,750]
trigger2 = enemy, prevstateno = 5120
trigger2 = var(1) = [700,999]


;---------------------------------------------------------------------------
;Anti-Air Super
[State -1, Anti-Air Super]
type = Changestate
value = 3100
triggerall = var(0)
triggerall = power >= 1000
triggerall = statetype = S || statetype = C
triggerall = fvar(3) >= .75
triggerall = (enemy, backedgebodydist) > 40
trigger1 = movehit
trigger1 = p2bodydist Y+ (enemy, vel Y*10) + (enemy, const(movement.yaccel)*50) = [-130, -40]
trigger1 = (stateno = 200)||(stateno=400)||(stateno = 163)
trigger1 = var(2)
trigger2 = prevstateno = 410
trigger2 = fvar(3) = .75
trigger2 = ctrl
trigger2 = target, gethitvar(fall)
trigger2 = p2bodydist Y+ (enemy, vel Y*10) + (.68*50) = [-130, -40]

;---------------------------------------------------------------------------
;Anti Air Throw
[State -1, Anti Air Throw]
type = Changestate
value = 1102
triggerall = var(0)
triggerall = statetype = S || statetype = C
triggerall = (p2bodydist X = [20,68])
triggerall = p2statetype = A
trigger1 = var(1) = [200,220]
trigger1 = p2movetype != A
trigger1 = p2bodydist Y+ (enemy, vel Y*10) + (enemy, const(movement.yaccel)*50) = [-150, -60]
trigger1 = ctrl
trigger2 = movehit
trigger2 = target, gethitvar(fall)
trigger2 = enemy, backedgebodydist > 5 || p2bodydist Y > -40
trigger2 = p2bodydist Y+ (enemy, vel Y*10) + (enemy, const(movement.yaccel)*50) = [-150, -60]
trigger2 = (stateno = 200)||(stateno=400)||(stateno = 163)
trigger2 = var(2)
trigger3 = var(2)
trigger3 = stateno = 1005

;---------------------------------------------------------------------------
;Anti Air Throw
[State -1, Anti Air Throw]
type = Changestate
value = 1101
triggerall = var(0)
triggerall = statetype = S || statetype = C
triggerall = (enemy, backedgebodydist <= 5)
triggerall = p2statetype = A
trigger1 = var(2)
trigger1 = stateno = 1005

;---------------------------------------------------------------------------
;Forward C
[State -1, Forward C]
type = ChangeState
value = 230
triggerall = var(0)
triggerall = statetype = S || statetype = C
triggerall = p2bodydist X = [0,59]
trigger1 = var(1) = [550,560]
trigger1 = p2statetype = S || p2statetype = C
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno = 400)
trigger2 = var(2)
trigger2 = moveguarded
trigger2 = var(1) = [550,900]
trigger2 = p2statetype = S || p2statetype = C
trigger3 = p2stateno = 5120
trigger3 = ctrl
trigger3 = enemy, anim = 5120
trigger3 = enemy, animtime = [10,13]
trigger3 = var(1) = [300,460]
trigger4 = numtarget
trigger4 = target, gethitvar(fall)
trigger4 = enemy, backedgebodydist <= 5
trigger4 = (stateno = 200) || (stateno = 400)
trigger4 = var(2)
trigger4 = p2bodydist Y+ (enemy, vel Y*14) + (66.64) = [-88, 0]
trigger5 = numtarget
trigger5 = target, gethitvar(fall)
trigger5 = enemy, backedgebodydist <= 5
trigger5 = ctrl
trigger5 = p2bodydist Y+ (enemy, vel Y*14) + (66.64) = [-88, 0]
trigger6 = ctrl
trigger6 = prevstateno = 1107
trigger6 = time = 1
trigger6 = backedgebodydist < 10

;---------------------------------------------------------------------------
;Standing A
[State -1, Standing A]
type = ChangeState
value = 200
triggerall = var(0)
triggerall = p2statetype = A
triggerall = p2bodydist Y = [-88, 0]
triggerall = var(1) = [0,70]
trigger1 = p2bodydist X = [0,48]
trigger1 = statetype != A
trigger1 = ctrl
trigger2 = p2bodydist X = [0,48]
trigger2 = (stateno = 200) || (stateno = 400)
trigger2 = var(2)
trigger3 = ctrl
trigger3 = numtarget
trigger3 = target, gethitvar(fall)
trigger3 = prevstateno = 230
trigger3 = target, backedgebodydist <= 5
trigger3 = statetype != A

;---------------------------------------------------------------------------
;Crouching A
[State -1, Crouching A]
type = ChangeState
value = 400
triggerall = var(0)
triggerall = p2bodydist X = [0,48]
triggerall = p2statetype != L
triggerall = p2bodydist Y = [-64, 0]
trigger1 = var(1) = [100,190]
trigger1 = statetype != A
trigger1 = ctrl
trigger2 = var(1) = [100,190]
trigger2 = (stateno = 200) || (stateno = 400)
trigger2 = var(2)
trigger3 = ctrl
trigger3 = prevstateno = 230
trigger3 = time = 1
trigger3 = p2movetype = H
trigger3 = var(1) = [0,333]

;---------------------------------------------------------------------------
;Command Throw (Dash)
[State -1, Command Throw]
type = Changestate
value = 1001
triggerall = var(0)
triggerall = statetype != A
triggerall = p2bodydist X = [0,124]
trigger1 = p2statetype = S || p2statetype = C
trigger1 = ctrl
trigger1 = prevstateno = 230
trigger1 = time = 1
trigger1 = var(1) = [334,666]
trigger2 = p2statetype != L
trigger2 = ctrl
trigger2 = prevstateno = 210 || prevstateno = 410
trigger2 = p2movetype = H
trigger2 = time = 1
trigger2 = var(1) = [500,999]
trigger2 = p2statetype = A
trigger2 = p2bodydist Y+ (enemy, vel Y*20) + (enemy, const(movement.yaccel)*200) >= 0

;---------------------------------------------------------------------------
;Dash Fwd
[State -1, Dash Fwd]
type = ChangeState
value = 100
triggerall = var(0)
triggerall = statetype = S || statetype = C
triggerall = ctrl
triggerall = enemynear, movetype != A
trigger1 = enemy, backedgebodydist > 5
trigger1 = !enemy, gethitvar(fall)
trigger1 = prevstateno = 230
trigger1 = time = 1
trigger1 = var(1) = [667,999]
trigger2 = var(1) = [570,600]
trigger2 = p2bodydist X > 150
trigger3 = p2stateno = 105
trigger3 = var(1) = [570,630]

;---------------------------------------------------------------------------
;Command Throw (Dash)
[State -1, Command Throw]
type = Changestate
value = 1002
triggerall = var(0)
triggerall = statetype != A
triggerall = p2bodydist X = [125,130]
triggerall = p2statetype != L
trigger1 = ctrl
trigger1 = p2stateno = 105
trigger1 = var(1) = [631, 690]

;---------------------------------------------------------------------------
;Standing B
[State -1, Standing B]
type = ChangeState
value = 210
triggerall = var(0)
triggerall = p2bodydist x = [48, 72]
triggerall = p2statetype = S
triggerall = statetype = S || statetype = C
trigger1 = var(1) = [250,290]
trigger1 = ctrl
trigger2 = (stateno = 200) || (stateno = 400)
trigger2 = movecontact
trigger2 = var(1) = [250,340]
trigger2 = var(2)

;---------------------------------------------------------------------------
;Crouching B
[State -1, Crouching B]
type = ChangeState
value = 410
triggerall = var(0)
triggerall = statetype = S || statetype = C
triggerall = p2bodydist Y+ (enemy, vel Y*5) + (enemy, const(movement.yaccel)*12.5) = [-112, 0]
triggerall = p2statetype = A
triggerall = !enemy, gethitvar(fall)
trigger1 = var(1) = [350,400]
trigger1 = p2bodydist x = [0, 56]
trigger1 = ctrl
trigger2 = enemy, backedgebodydist > 5
trigger2 = movehit
trigger2 = (stateno = 200) || (stateno = 400)
trigger2 = var(2)

;---------------------------------------------------------------------------
;Crouching C
[State -1, Crouching C]
type = ChangeState
value = 420
triggerall = var(0)
triggerall = statetype = C || statetype = S
triggerall = p2statetype != A
triggerall = p2bodydist X = [32,88]
triggerall = ctrl
trigger1 = var(1) = [400,420]
trigger2 = var(1) = [370,420]
trigger2 = p2statetype = L
trigger2 = p2stateno != 5120

;---------------------------------------------------------------------------
;Standing C
[State -1, Standing C]
type = ChangeState
value = 220
triggerall = var(0)
triggerall = p2bodydist X = [55,96]
triggerall = statetype != A
triggerall = p2statetype != A
triggerall = ctrl
trigger1 = p2statetype != L
trigger1 = var(1) = [425,460]
trigger2 = p2stateno = 5120
trigger2 = enemy, anim = 5120
trigger2 = enemy, animtime <= 8
trigger2 = var(1) = [400,460]

;---------------------------------------------------------------------------
;Neutral Jumping C
[State -1, Neutral Jumping C]
type = ChangeState
value = 620
triggerall = var(0)
triggerall = vel X = 0
triggerall = p2bodydist X = [0,56]
triggerall = statetype = A
triggerall = pos Y+ (vel Y*6) + (12.24) = [-50, 0]
triggerall = ctrl
trigger1 = var(1) = [550,760]
trigger2 = p2stateno = 5120
trigger2 = enemy, anim = 5120
trigger2 = enemy, animtime <= 5
trigger3 = enemy, backedgebodydist <= 5
trigger3 = var(1) = [450,760]

;---------------------------------------------------------------------------
;Jumping C
[State -1, Jumping C]
type = ChangeState
value = 630
triggerall = var(0)
triggerall = vel X != 0
triggerall = p2bodydist X = [0,48]
triggerall = statetype = A
triggerall = pos Y+ (vel Y*6) + (12.24) = [-35, 0]
trigger1 = var(1) = [600,760]
trigger1 = ctrl

;---------------------------------------------------------------------------
;Boob Splash
[State -1, Boobs]
type = ChangeState
value = 640
triggerall = var(0)
triggerall = p2bodydist X = [0,68]
triggerall = p2statetype != L
trigger1 = vel x > 0
trigger1 = statetype = A
trigger1 = ctrl
trigger1 = var(1) = [600,620]
trigger1 = p2bodydist Y > 0

;---------------------------------------------------------------------------
;Jumping B
[State -1, Jumping B]
type = ChangeState
value = 610
triggerall = var(0)
triggerall = statetype = A
triggerall = ctrl
triggerall = p2bodydist X = [-40,24]
triggerall = p2statetype = S
triggerall = pos Y+ (vel Y*9) + (27.54) = [-55, 0]
trigger1 = var(1) = [420,580]

;---------------------------------------------------------------------------
;Jumping A
[State -1, Jumping A]
type = ChangeState
value = 600
triggerall = var(0)
triggerall = p2bodydist y = [-96,-30]
triggerall = p2bodydist X = [0,56]
triggerall = statetype = A
triggerall = ctrl
trigger1 = var(1) = [290,420]

;---------------------------------------------------------------------------
[State -1, Air Throw]
type = Changestate
value = 815
triggerall = var(0)
triggerall = p2bodydist y = [-15,10]
triggerall = p2bodydist X = [0,20]
triggerall = ctrl
triggerall = statetype = A
trigger1 = var(1) = [100,290]
trigger1 = pos y < -75

;---------------------------------------------------------------------------
[State -1, Reflect]
type = changestate
value = 160
triggerall = var(0)
triggerall = inguarddist
triggerall = p2bodydist X = [0,48]
trigger1 = ctrl
trigger1 = p2statetype != C
trigger1 = statetype != C
trigger1 = var(1) = [542,578+(1000-life)/10]
trigger2 = ctrl
trigger2 = p2statetype != A
trigger2 = statetype = C
trigger2 = var(1) = [542,578+(1000-life)/10]
trigger3 = (stateno = [167,169])
trigger3 = var(2)
trigger3 = inguarddist
trigger3 = var(1) = [502,578+(1000-life)/5]
trigger4 = (stateno = 162)
trigger4 = inguarddist

;---------------------------------------------------------------------------
;Hop Back
[State -1, Hop Back]
type = ChangeState
value = 105
triggerall = var(0)
triggerall = statetype = S || statetype = C
triggerall = ctrl
triggerall = p2bodydist X = [0,30]
trigger1 = p2stateno = 5120
trigger1 = enemy, anim = 5120
trigger1 = enemy, animtime = [10,13]
trigger1 = var(1) = [461,650]
trigger2 = p2movetype = A
trigger2 = enemy, vel X = 0
trigger2 = var(1) = [581,650]

;---------------------------------------------------------------------------
;Jump
[State -1, Jump]
type = ChangeState
value = 40
triggerall = var(0)
triggerall = statetype = S || statetype = C
triggerall = ctrl
trigger1 = p2bodydist X = [0,30]
trigger1 = p2stateno = 5120
trigger1 = enemy, anim = 5120
trigger1 = enemy, animtime = [10,13]
trigger1 = var(1) = [651,870]
trigger2 = p2bodydist X = [0,40]
trigger2 = enemy, backedgebodydist <= 5
trigger2 = var(1) = [800,870]

;---------------------------------------------------------------------------
[State -1, Normal Throw]
type = Changestate
value = 800 + 5*(random>=500)
triggerall = var(0)
triggerall = statetype = S || statetype = C
triggerall = p2bodydist X = [0,30]
triggerall = ctrl
trigger1 = enemy, prevstateno = 5120 || enemy, prevstateno = 5200
trigger1 = enemy, time = 2
trigger1 = var(1) = [300,670]
trigger2 = prevstateno = 5120 || prevstateno = 5200
trigger2 = time = 1
trigger2 = p2movetype != A
trigger2 = p2statetype = S || p2statetype = C