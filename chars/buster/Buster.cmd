; The CMD file.
;
; Two parts: 1. Command definition and  2. State entry
; (state entry is after the commands def section)
;
; 1. Command definition
; ---------------------
; Note: The commands are CASE-SENSITIVE, and so are the command names.
; The eight directions are:
;   B, DB, D, DF, F, UF, U, UB     (all CAPS)
;   corresponding to back, down-back, down, downforward, etc.
; The six buttons are:
;   a, b, c, x, y, z               (all lower case)
;   In default key config, abc are are the bottom, and xyz are on the
;   top row. For 2 button characters, we recommend you use a and b.
;   For 6 button characters, use abc for kicks and xyz for punches.
;
; Each [Command] section defines a command that you can use for
; state entry, as well as in the CNS file.
; The command section should look like:
;
;   [Command]
;   name = some_name
;   command = the_command
;   time = time (optional)
;   buffer.time = time (optional)
;
; - some_name
;   A name to give that command. You'll use this name to refer to
;   that command in the state entry, as well as the CNS. It is case-
;   sensitive (QCB_a is NOT the same as Qcb_a or QCB_A).
;
; - command
;   list of buttons or directions, separated by commas. Each of these
;   buttons or directions is referred to as a "symbol".
;   Directions and buttons can be preceded by special characters:
;   slash (/) - means the key must be held down
;          egs. command = /D       ;hold the down direction
;               command = /DB, a   ;hold down-back while you press a
;   tilde (~) - to detect key releases
;          egs. command = ~a       ;release the a button
;               command = ~D, F, a ;release down, press fwd, then a
;          If you want to detect "charge moves", you can specify
;          the time the key must be held down for (in game-ticks)
;          egs. command = ~30a     ;hold a for at least 30 ticks, then release
;   dollar ($) - Direction-only: detect as 4-way
;          egs. command = $D       ;will detect if D, DB or DF is held
;               command = $B       ;will detect if B, DB or UB is held
;   plus (+) - Buttons only: simultaneous press
;          egs. command = a+b      ;press a and b at the same time
;               command = x+y+z    ;press x, y and z at the same time
;   greater-than (>) - means there must be no other keys pressed or released
;                      between the previous and the current symbol.
;          egs. command = a, >~a   ;press a and release it without having hit
;                                  ;or released any other keys in between
;   You can combine the symbols:
;     eg. command = ~30$D, a+b     ;hold D, DB or DF for 30 ticks, release,
;                                  ;then press a and b together
;
;   Note: Successive direction symbols are always expanded in a manner similar
;         to this example:
;           command = F, F
;         is expanded when MUGEN reads it, to become equivalent to:
;           command = F, >~F, >F
;
;   It is recommended that for most "motion" commads, eg. quarter-circle-fwd,
;   you start off with a "release direction". This makes the command easier
;   to do.
;
; - time (optional)
;   Time allowed to do the command, given in game-ticks. The default
;   value for this is set in the [Defaults] section below. A typical
;   value is 15.
;
; - buffer.time (optional)
;   Time that the command will be buffered for. If the command is done
;   successfully, then it will be valid for this time. The simplest
;   case is to set this to 1. That means that the command is valid
;   only in the same tick it is performed. With a higher value, such
;   as 3 or 4, you can get a "looser" feel to the command. The result
;   is that combos can become easier to do because you can perform
;   the command early. Attacks just as you regain control (eg. from
;   getting up) also become easier to do. The side effect of this is
;   that the command is continuously asserted, so it will seem as if
;   you had performed the move rapidly in succession during the valid
;   time. To understand this, try setting buffer.time to 30 and hit
;   a fast attack, such as KFM's light punch.
;   The default value for this is set in the [Defaults] section below.
;   This parameter does not affect hold-only commands (eg. /F). It
;   will be assumed to be 1 for those commands.
;
; If you have two or more commands with the same name, all of them will
; work. You can use it to allow multiple motions for the same move.
;
; Some common commands examples are given below.
;
; [Command] ;Quarter circle forward + x
; name = "QCF_x"
; command = ~D, DF, F, x
;
; [Command] ;Half circle back + a
; name = "HCB_a"
; command = ~F, DF, D, DB, B, a
;
; [Command] ;Two quarter circles forward + y
; name = "2QCF_y"
; command = ~D, DF, F, D, DF, F, y
;
; [Command] ;Tap b rapidly
; name = "5b"
; command = b, b, b, b, b
; time = 30
;
; [Command] ;Charge back, then forward + z
; name = "charge_B_F_z"
; command = ~60$B, F, z
; time = 10
;
; [Command] ;Charge down, then up + c
; name = "charge_D_U_c"
; command = ~60$D, U, c
; time = 10


;-| Button Remapping |-----------------------------------------------------
; This section lets you remap the player's buttons (to easily change the
; button configuration). The format is:
;   old_button = new_button
; If new_button is left blank, the button cannot be pressed.
[Remap]
x = x
y = y
z = z
a = a
b = b
c = c
s = s

;-| Default Values |-------------------------------------------------------
[Defaults]
; Default value for the "time" parameter of a Command. Minimum 1.
command.time = 15

; Default value for the "buffer.time" parameter of a Command. Minimum 1,
; maximum 30.
command.buffer.time = 1


;-| Super Motions |--------------------------------------------------------
;The following two have the same name, but different motion.
;Either one will be detected by a "command = TripleKFPalm" trigger.
;Time is set to 20 (instead of default of 15) to make the move
;easier to do.
;

;-| Special Motions |------------------------------------------------------

;-| Double Tap |-----------------------------------------------------------
[Command]
name = "FF"     ;Required (do not remove)
command = F, F
time = 10

[Command]
name = "BB"     ;Required (do not remove)
command = B, B
time = 10

;-| 2/3 Button Combination |-----------------------------------------------
[Command]
name = "recovery";Required (do not remove)
command = x+y
time = 1

[Command]
name = "counter"
command = z+c
time = 3

[Command]
name = "counter"
command = c+z
time = 3

[Command]
name ="Luggy"
command = b+y
time = 1

[Command]
name ="TheBigOne"
command = x+b+z
time = 1


;-| Dir + Button |---------------------------------------------------------

;-| Single Button |---------------------------------------------------------
[Command]
name = "a"
command = a
time = 1

[Command]
name = "b"
command = b
time = 1

[Command]
name = "c"
command = c
time = 1

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
name = "start"
command = s
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

;---------------------------------------------------------------------------
; 2. State entry
; --------------
; This is where you define what commands bring you to what states.
;
; Each state entry block looks like:
;   [State -1, Label]           ;Change Label to any name you want to use to
;                               ;identify the state with.
;   type = ChangeState          ;Don't change this
;   value = new_state_number
;   trigger1 = command = command_name
;   . . .  (any additional triggers)
;
; - new_state_number is the number of the state to change to
; - command_name is the name of the command (from the section above)
; - Useful triggers to know:
;   - statetype
;       S, C or A : current state-type of player (stand, crouch, air)
;   - ctrl
;       0 or 1 : 1 if player has control. Unless "interrupting" another
;                move, you'll want ctrl = 1
;   - stateno
;       number of state player is in - useful for "move interrupts"
;   - movecontact
;       0 or 1 : 1 if player's last attack touched the opponent
;                useful for "move interrupts"
;
; Note: The order of state entry is important.
;   State entry with a certain command must come before another state
;   entry with a command that is the subset of the first.
;   For example, command "fwd_a" must be listed before "a", and
;   "fwd_ab" should come before both of the others.
;
; For reference on triggers, see CNS documentation.
;
; Just for your information (skip if you're not interested):
; This part is an extension of the CNS. "State -1" is a special state
; that is executed once every game-tick, regardless of what other state
; you are in.


; Don't remove the following line. It's required by the CMD standard.
[Statedef -1]

;AI, ACTIVATE!==============================================================

[State -1, AI ON] ; Turn the AI on when
Type = VarSet
TriggerAll = Var(59) < 1 ; it is not on yet and
TriggerAll = RoundState = 2 ; the fight has started and is not over yet and
Trigger1 = AILevel > 0 ; the computer is playing the character
v = 59
value = 1 ; value of 1 will mean the AI is on
Ignorehitpause=1

[State -1, AI OFF] ; Turn the AI off when
Type = VarSet
Trigger1 = var(59) > 0 ; it is on and
Trigger1 = RoundState != 2 ; the round is not started yet or is already over
Trigger2 = !IsHelper ; OR if we are a player, but
Trigger2 = AILevel = 0 ; the computer is not in control
v = 59
value = 0 ; value of 0 will mean the AI is off. values other than 0 and 1 are not used in this example, we have only one AI mode, the normal one.
Ignorehitpause = 1

;===========================================================================
;---------------------------------------------------------------------------
;Counter Wolf
[State -1, Counter Wolf]
type = ChangeState
value = 1300
triggerall = command = "counter"
Triggerall = var(59) = 0
trigger1 = ctrl
trigger1 = statetype != A
trigger2 = stateno = 1310 || stateno = 1330
trigger2 = time > 0

;---------------------------------------------------------------------------
;Run Fwd
[State -1, Run Fwd]
type = ChangeState
value = 100
triggerall = var(59) = 0
trigger1 = command = "FF"
trigger1 = statetype = S
trigger1 = ctrl

;---------------------------------------------------------------------------
;Run Back
[State -1, Run Back]
type = ChangeState
value = 105
triggerall = var(59) = 0
trigger1 = command = "BB"
trigger1 = statetype = S
trigger1 = ctrl
trigger2 = command = "BB"
trigger2 = stateno = 215

;===========================================================================
;---------------------------------------------------------------------------
;The Big One (Uses 1 super bar)
[State -1, The Big One]
type = ChangeState
value = 3000
triggerall = var(59) = 0
triggerall = command = "TheBigOne"
triggerall = power >= 1000
trigger1 = statetype != A
trigger1 = ctrl
trigger2 = stateno = 400 || stateno = 410 || stateno = 420 || stateno = 430 || stateno = 440
trigger2 = movecontact

;---------------------------------------------------------------------------
;Buster Wolf (Mark of the Wolves)
[State -1, Buster Wolf (Mark of the Wolves)]
type = ChangeState
value = 200
triggerall = var(59) = 0
triggerall = command = "x"
triggerall = command != "holddown"
trigger1 = statetype = S
trigger1 = ctrl
trigger2 = stateno = 400 || stateno = 410 || stateno = 420 || stateno = 430 || stateno = 440
trigger2 = movecontact

;---------------------------------------------------------------------------
;Buster Wolf (KoF 2003)
[State -1, Buster Wolf (KoF 2003)]
type = ChangeState
value = 210
triggerall = var(59) = 0
triggerall = command = "y"
triggerall = command != "holddown"
trigger1 = statetype = S
trigger1 = ctrl
trigger2 = (stateno = 200) && time > 5
trigger3 = (stateno = 230) && time > 6
trigger4 = stateno = 400 || stateno = 410 || stateno = 420 || stateno = 430 || stateno = 440
trigger4 = movecontact


;---------------------------------------------------------------------------
;Buster Wolf (KoF XIII)
[State -1, Buster Wolf (KoF XIII)]
type = ChangeState
value = 220
triggerall = var(59) = 0
triggerall = command = "z"
triggerall = command != "holddown"
trigger1 = statetype = S
trigger1 = ctrl
trigger2 = (stateno = 210) && time > 5
trigger3 = (stateno = 240) && time > 6
trigger4 = stateno = 400 || stateno = 410 || stateno = 420 || stateno = 430 || stateno = 440 || stateno = 450
trigger4 = movecontact

;---------------------------------------------------------------------------
;Buster Wolf (SvC Chaos)
[State -1, Buster Wolf (SvC Chaos)]
type = ChangeState
value = 230
triggerall = var(59) = 0
triggerall = command = "a"
triggerall = command != "holddown"
trigger1 = statetype = S
trigger1 = ctrl
trigger2 = (stateno = 200) && time > 7
trigger3 = stateno = 400 || stateno = 410 || stateno = 420 || stateno = 430 || stateno = 440
trigger3 = movecontact

;---------------------------------------------------------------------------
;Buster Wolf (Capcom VS SNK 1/2)
[State -1, Buster Wolf (Capcom VS SNK 1/2)]
type = ChangeState
value = 240
triggerall = var(59) = 0
triggerall = command = "b"
triggerall = command != "holddown"
trigger1 = statetype = S
trigger1 = ctrl
trigger2 = (stateno = 200) && time > 5
trigger3 = (stateno = 230) && time > 6
trigger4 = stateno = 400 || stateno = 410 || stateno = 420 || stateno = 430 || stateno = 440
trigger4 = movecontact

;---------------------------------------------------------------------------
;Buster Legacy (Uses 2 super bars)
[State -1, Buster Legacy]
type = ChangeState
value = 250
triggerall = var(59) = 0
triggerall = power >= 2000
triggerall = command = "c"
triggerall = command != "holddown"
trigger1 = statetype = S
trigger1 = ctrl
trigger2 = (stateno = 200) && time > 5
trigger3 = (stateno = 230) && time > 6
trigger4 = stateno = 400 || stateno = 410 || stateno = 420 || stateno = 430 || stateno = 440 || stateno = 450
trigger4 = movecontact

;---------------------------------------------------------------------------
;Taunt
[State -1, Taunt]
type = ChangeState
value = 196
triggerall = var(59) = 0
triggerall = command = "start"
triggerall = fvar(3) < 1
trigger1 = statetype != A
trigger1 = ctrl
trigger2 = stateno = 205 || stateno = 215 || stateno = 225 || stateno = 245
trigger2 = movecontact
trigger3 = stateno = 235
trigger3 = time > 12

;---------------------------------------------------------------------------
;Crouching Light Punch
[State -1, Crouching Light Punch]
type = ChangeState
value = 400
triggerall = var(59) = 0
triggerall = command = "x"
triggerall = command = "holddown"
trigger1 = statetype = C
trigger1 = ctrl
trigger2 = stateno = 400
trigger2 = time > 9
trigger3 = stateno = 400
trigger3 = movecontact
trigger4 = stateno = 430
trigger4 = movecontact

;---------------------------------------------------------------------------
;Crouching Medium Punch
[State -1, Crouching Medium Punch]
type = ChangeState
value = 410
triggerall = var(59) = 0
triggerall = command = "y"
triggerall = command = "holddown"
trigger1 = statetype = C
trigger1 = ctrl
trigger2 = stateno = 400
trigger2 = time > 2
trigger3 = stateno = 430
trigger3 = movecontact


;---------------------------------------------------------------------------
;Crouching Strong Punch
[State -1, Crouching Strong Punch]
type = ChangeState
value = 420
triggerall = var(59) = 0
triggerall = command = "z"
triggerall = command = "holddown"
trigger1 = statetype = C
trigger1 = ctrl
trigger2 = (stateno = 410) || (stateno = 440) || (stateno = 444)
trigger2 = (time > 9) || (movecontact && time > 5)
trigger3 = (stateno = 410) || (stateno = 430)
trigger3 = movecontact

;---------------------------------------------------------------------------
;Crouching Light Kick
[State -1, Crouching Light Kick]
type = ChangeState
value = 430
triggerall = var(59) = 0
triggerall = command = "a"
triggerall = command = "holddown"
trigger1 = statetype = C
trigger1 = ctrl

;---------------------------------------------------------------------------
;Crouching Medium Kick
[State -1, Crouching Strong Kick]
type = ChangeState
value = 440
triggerall = var(59) = 0
triggerall = command = "b"
triggerall = command = "holddown"
trigger1 = statetype = C
trigger1 = ctrl
trigger2 = (stateno = 400) || (stateno = 430)
trigger2 = movecontact

;---------------------------------------------------------------------------
;Power Wave(?)
[State -1, Power Wave(?)]
type = ChangeState
value = 450
triggerall = var(59) = 0
triggerall = command = "c"
triggerall = command = "holddown"
trigger1 = statetype = C
trigger1 = ctrl
trigger2 = (stateno = 410) || (stateno = 440) || (stateno = 444)
trigger2 = movecontact
trigger3 = (stateno = 420) && time > 9
trigger4 = (stateno = 420) && animelem = 3
trigger4 = (stateno = 420) && movecontact
trigger5 = stateno = 430
trigger5 = movecontact

;---------------------------------------------------------------------------
;Jump Light Punch
[State -1, Jump Light Punch]
type = ChangeState
value = 600
triggerall = var(59) = 0
triggerall = command = "x"
trigger1 = statetype = A
trigger1 = ctrl
trigger2 = stateno = 600
trigger2 = statetime >= 7

;---------------------------------------------------------------------------
;Jump Medium Punch
[State -1, Jump Medium Punch]
type = ChangeState
value = 610
triggerall = var(59) = 0
triggerall = command = "y"
trigger1 = statetype = A
trigger1 = ctrl
trigger2 = stateno = 600 || stateno = 630 ;jump_x or jump_a
trigger2 = movecontact

;---------------------------------------------------------------------------
;Jump Strong Punch
[State -1, Jump Strong Punch]
type = ChangeState
value = 620
triggerall = var(59) = 0
triggerall = command = "z"
trigger1 = statetype = A
trigger1 = ctrl
trigger2 = stateno = 610 || stateno = 640 || stateno = 660
trigger2 = movecontact

;---------------------------------------------------------------------------
;Jump Light Kick
[State -1, Jump Light Kick]
type = ChangeState
value = 630
triggerall = var(59) = 0
triggerall = command = "a"
trigger1 = statetype = A
trigger1 = ctrl

;---------------------------------------------------------------------------
;Jump Medium Kick
[State -1, Jump Medium Kick]
type = ChangeState
value = 640
triggerall = var(59) = 0
triggerall = command = "b"
trigger1 = statetype = A
trigger1 = ctrl
trigger2 = stateno = 600 || stateno = 630 ;jump_x or jump_a
trigger2 = movecontact

;---------------------------------------------------------------------------
;Rising Tackle
[State -1, Rising Tackle]
type = ChangeState
value = 660
triggerall = var(59) = 0
triggerall = command = "holdup"
triggerall = command = "c"
trigger1 = statetype = A
trigger1 = ctrl
trigger2 = stateno = 610 || stateno = 640
trigger2 = movecontact

;---------------------------------------------------------------------------
;Jump Strong Kick
[State -1, Jump Strong Kick]
type = ChangeState
value = 650
triggerall = var(59) = 0
triggerall = command = "c"
trigger1 = statetype = A
trigger1 = ctrl
trigger2 = stateno = 610 || stateno = 640 ;jump_x or jump_a
trigger2 = movecontact

;---------------------------------------------------------------------------
; Ey, I think this is where the computer does the thing.

;--------|Character Specific Actions|--------




;Buster Legacy (Uses 2 super bars)
[State -1, AI]
type = ChangeState
value = 250
triggerall = power >= 2000
triggerall = statetype != A
triggerall = p2statetype != L
Triggerall = var(59) > 0
triggerall = AIlevel >= 1
triggerall = roundstate = 2
triggerall = fvar(3) = 0
trigger1 = ctrl
trigger1 = enemy, name = "Ozma" ;Back up, and prepare to bust him again.
trigger1 = p2bodydist x > 41
trigger2 = ctrl
trigger2 = enemy, name = "Ozma the Jawbreaker" ;Back up, and prepare to bust him up again.
trigger2 = p2bodydist x > 41


;Buster Wolf (XIII)
[State -1, AI]
type = ChangeState
value = 220
triggerall = power < 2000
triggerall = roundstate = 2
triggerall = var(59) > 0
triggerall = statetype != A
triggerall = p2statetype != L
trigger1 = ctrl
trigger1 = enemy, name = "Ozma" ;Back up, and prepare to bust him again.
trigger1 = p2bodydist x > 41
trigger2 = ctrl
trigger2 = enemy, name = "Ozma the Jawbreaker" ;Back up, and prepare to bust him up again.
trigger2 = p2bodydist x > 41

;Are You Okay?
[State -1, AI]
type = ChangeState
value = 196
triggerall = roundstate = 2
triggerall = var(59) > 0
triggerall = statetype != A
triggerall = fvar(3) < 1
triggerall = !win
trigger1 = stateno = 225 && animelem = 11
trigger1 = enemy, name = "Ozma" ;Back up, and prepare to bust him again.
trigger2 = stateno = 225 && animelem = 11
trigger2 = enemy, name = "Ozma the Jawbreaker" ;Back up, and prepare to bust him up again.

;------|Defensive Measures|------

;Daigo that shit
[State -1, AI]
type = ChangeState
triggerall = numhelper(1320) = 0
triggerall = random <= 400
triggerall = var(59) > 0
triggerall = (StateType != A)
triggerall = (P2statetype != A)
triggerall = (P2Movetype = A) || (enemy, NumProj > 0)
trigger1 = random <= 300
trigger1 = ctrl
trigger2 = random <= 600
trigger2 = ctrl
trigger2 = enemy, NumHelper > 0
trigger2 = enemy, isHelper && vel x != 0
trigger3 = random <= 600
trigger3 = ctrl
trigger3 = enemy, NumHelper > 0
trigger3 = enemy, isHelper && vel y != 0
value = 1300

;Guard Crouch Attacks
[State -1, AI]
type = ChangeState
triggerall = numhelper(1320) = 0
triggerall = random <= 400
triggerall = inguarddist
triggerall = var(59) > 0
triggerall = (StateType != A)
triggerall = (P2statetype = C)
triggerall = (P2Movetype = A) || (enemy, NumProj > 0)
trigger1 = ctrl
trigger1 = random <= 300
trigger2 = stateno = 195
trigger1 = random <= 600
value = 1300

;Guard Air Attacks (While on ground)
[State -1, AI]
type = ChangeState
triggerall = numhelper(1320) = 0
triggerall = random <= 400
triggerall = inguarddist
triggerall = var(59) > 0
triggerall = (StateType != A)
triggerall = (P2statetype = A)
triggerall = (P2Movetype = A) || (enemy, NumProj > 0)
trigger1 = ctrl
trigger1 = random <= 300
trigger2 = stateno = 195
trigger2 = random <= 600
value = 1300


;Crouch Guard
[State -1]
Type=Changestate
triggerall = inguarddist
triggerall = var(59) > 0 
triggerall = ctrl 
triggerall = (StateType != A)
triggerall = (P2statetype != A)
triggerall = (p2statetype = S)
triggerall = (p2statetype = C)
triggerall = (P2Movetype = A) ;|| (enemy, NumProj > 0)
Trigger1 = random < (var(50)*2+(AiLevel>=3)*30)
value = 131

[State -1] ; The engine will still guard by through pressing the back button, we need to disable that.
type=Assertspecial
triggerall = StateNo != [120,160]
trigger1 = var(59) > 0
flag = noairguard
flag2 = nocrouchguard
flag3 = nostandguard

;Guard Standing Attacks
[State -1, AI]
type = ChangeState
triggerall = var(59) > 0
triggerall = (StateType != A)
triggerall = (P2statetype != A)
triggerall = (P2Movetype = A) ;|| (enemy, NumProj > 0)
trigger1 = ctrl
value = 131

;Stand-to-Crouch Guard
[State -1, AI]
type = ChangeState
triggerall = var(59) > 0
triggerall = (StateType != A)
triggerall = (P2statetype = C)
triggerall = (P2Movetype = A) ;|| (enemy, NumProj > 0)
trigger1 = stateno = 150
trigger2 = stateno = 130
value = 152

;Guard Crouch Attacks
[State -1, AI]
type = ChangeState
triggerall = var(59) > 0
triggerall = (StateType != A)
triggerall = (P2statetype = C)
triggerall = (P2Movetype = A) ;|| (enemy, NumProj > 0)
trigger1 = ctrl
value = 131

;Crouch-to-Stand Guard
[State -1, AI]
type = ChangeState
triggerall = var(59) > 0
triggerall = (StateType != A)
triggerall = (P2statetype != S)
triggerall = (P2statetype != C)
triggerall = (P2Movetype = A) ;|| (enemy, NumProj > 0)
trigger1 = stateno = 152
value = 150

;Guard Aerial Attacks
[State -1, AI]
type = ChangeState
triggerall = var(59) > 0
triggerall = (StateType != A)
triggerall = (P2statetype != S)
triggerall = (P2statetype != C)
triggerall = (P2Movetype = A) ;|| (enemy, NumProj > 0)
trigger1 = ctrl = 1
value = 130

;Air Guard
[State -1, AI]
type = ChangeState
triggerall = var(59) > 0
triggerall = (StateType = A)
triggerall = (P2Movetype = A) ;|| (enemy, NumProj > 0)
trigger1 = ctrl = 1
value = 132

;------|Movement|------

;Hop Back
[State -1, AI]
type = ChangeState
value = 105
triggerall = statetype != A
triggerall = p2statetype != L
Triggerall = var(59) > 0
triggerall = AIlevel >= 1
triggerall = roundstate = 2
trigger1 = stateno = 215
trigger1 = moveguarded
trigger2 = ctrl
trigger2 = enemy, name = "The Deadly Dragon" ;Stop being spaghetti. Be the meat balls instead.
trigger2 = p2bodydist x < 71
trigger3 = ctrl
trigger3 = backedgebodydist > 60 ; Not too close to the wall
trigger3 = enemy, name = "Kraidgief" ;Stop being spaghetti. Be the meat balls instead.
trigger3 = p2bodydist x < 71
trigger4 = ctrl
trigger4 = enemy, name = "Ozma" ;Back up, and prepare to bust him again.
trigger4 = p2bodydist x < 41
trigger5 = ctrl
trigger5 = enemy, name = "Ozma the Jawbreaker" ;Back up, and prepare to bust him up again.
trigger5 = p2bodydist x < 41

;------|Offense|------


;------HYPER - Gee, Buster, how come mom lets you have two hypers?------

;The Big One (Uses 1 super bar)
[State -1, AI]
type = ChangeState
value = 3000
triggerall = power >= 1000
triggerall = statetype != A
Triggerall = var(59) > 0
triggerall = AIlevel >= 1
triggerall = roundstate = 2
trigger1 = enemynear, life <= 500 || life <= 500
trigger1 = fvar(3) != 0
trigger1 = p2bodydist x <= 185
trigger1 = p2bodydist y >= -100
trigger1 = ctrl
trigger2 = prevstateno = 255
trigger2 = ctrl


;Buster Legacy (Uses 2 super bars)
[State -1, AI]
type = ChangeState
value = 251
triggerall = power >= 2000
triggerall = statetype != A
triggerall = p2statetype != L
Triggerall = var(59) > 0
triggerall = AIlevel >= 1
triggerall = roundstate = 2
triggerall = fvar(3) = 0
trigger1 = ctrl
trigger1 = numhelper(455) > 0
trigger1 = p2bodydist y > -10

;Buster Legacy (Uses 2 super bars)
[State -1, AI]
type = ChangeState
value = 250
triggerall = power >= 2000
triggerall = statetype != A
triggerall = p2statetype != L
Triggerall = var(59) > 0
triggerall = AIlevel >= 1
triggerall = roundstate = 2
triggerall = fvar(3) = 0
trigger1 = stateno = 215
trigger1 = movehit



;------SPECIALS------

;------NORMALS------

;-------COMBO STARTERS------

;Air Light Kick
[State -1, AI]
type = ChangeState
value = 630
triggerall = statetype = A
triggerall = p2statetype = A
Triggerall = var(59) > 0
triggerall = AIlevel >= 1
triggerall = roundstate = 2
trigger1 = ctrl
trigger1 = p2bodydist x < 71

;Crouch Light Kick
[State -1, AI]
type = ChangeState
value = 430
triggerall = statetype != A
triggerall = p2statetype != L
Triggerall = var(59) > 0
triggerall = AIlevel >= 1
triggerall = roundstate = 2
triggerall = enemy, name != "The Deadly Dragon" ;Stop being spaghetti
triggerall = enemy, name != "Kraidgief"
trigger1 = ctrl
trigger1 = p2bodydist x < 66
trigger1 = p2bodydist y > -30

;Buster Wolf (KoF 2003)
[State -1, AI]
type = ChangeState
value = 210
triggerall = statetype != A
triggerall = p2statetype != L
Triggerall = var(59) > 0
triggerall = AIlevel >= 1
triggerall = roundstate = 2
triggerall = fvar(3) = 0
trigger1 = ctrl
trigger1 = p2movetype != A
trigger1 = p2bodydist x < 130
trigger1 = p2bodydist x > 71
trigger1 = p2bodydist y > -30
trigger2 = ctrl
trigger2 = backedgebodydist < 60 ; When too close to the wall to back away.
trigger2 = enemy, name = "Kraidgief"
trigger2 = p2bodydist x < 71

;Buster Wolf (CVS Chaos)
[State -1, AI]
type = ChangeState
value = 230
triggerall = statetype != A
triggerall = p2statetype != L
Triggerall = var(59) > 0
triggerall = AIlevel >= 1
triggerall = roundstate = 2
triggerall = fvar(3) > 0
trigger1 = ctrl
trigger1 = p2bodydist x < 130
trigger1 = p2bodydist x > 71
trigger1 = p2bodydist y > -30
trigger2 = ctrl
trigger2 = backedgebodydist < 60 ; When too close to the wall to back away.
trigger2 = enemy, name = "Kraidgief"
trigger2 = p2bodydist x < 71

;Power Wave(?)
[State -1, AI]
type = ChangeState
value = 450
triggerall = statetype != A
triggerall = p2statetype != L
Triggerall = var(59) > 0
triggerall = AIlevel >= 1
triggerall = roundstate = 2
triggerall = numhelper(455) < 2
triggerall = enemy, NumProj = 0
trigger1 = ctrl
trigger1 = p2bodydist x > 129
trigger1 = p2bodydist y > -90
trigger1 = enemy, NumHelper > 0
trigger1 = enemy, isHelper && vel x = 0
trigger1 = enemy, isHelper && vel y = 0
trigger2 = ctrl
trigger2 = p2bodydist x > 129
trigger2 = p2bodydist y > -90
trigger2 = enemy, NumHelper = 0

;------FOLLOW UP MOVES------

;Crouch Light Punch
[State -1, AI]
type = ChangeState
value = 400
triggerall = roundstate = 2
triggerall = var(59) > 0
triggerall = statetype != A
triggerall = p2bodydist x < 65
triggerall = p2statetype != L
trigger1 = stateno = 430 && movehit && time > 3 ;Hit confirmed with Crouch Light Kick

;Crouch Medium Punch
[State -1, AI]
type = ChangeState
value = 410
triggerall = roundstate = 2
triggerall = var(59) > 0
triggerall = statetype != A
triggerall = p2bodydist x < 85
triggerall = p2statetype != L
trigger1 = stateno = 400 && movehit && time > 3 ;Hit confirmed with Crouch Light Punch

;Crouch Heavy Punch
[State -1, AI]
type = ChangeState
value = 420
triggerall = roundstate = 2
triggerall = var(59) > 0
triggerall = statetype != A
triggerall = p2statetype != L
triggerall = p2bodydist x < 55
trigger1 = stateno = 410 && movehit ;Hit confirmed with Crouch Medium Punch

;Power Wave(?)
[State -1, AI]
type = ChangeState
value = 450
triggerall = roundstate = 2
triggerall = var(59) > 0
triggerall = statetype != A
triggerall = p2statetype != L
triggerall = p2bodydist x > 54
trigger1 = stateno = 410 && movehit ;Hit confirmed with Crouch Medium Punch

;Buster Wolf (KOF XIII)
[State -1, AI]
type = ChangeState
value = 220
triggerall = roundstate = 2
triggerall = var(59) > 0
triggerall = statetype != A
triggerall = p2statetype != L
trigger1 = fvar(3) > 0
trigger1 = p2movetype = H
trigger1 = stateno = 420 && movehit = 2 && hitcount = 2 ;Hit confirmed with Crouch Heavy Punch


;Buster Wolf (Capcom VS SNK 1/2)
[State -1, AI]
type = ChangeState
value = 240
triggerall = roundstate = 2
triggerall = var(59) > 0
triggerall = statetype != A
triggerall = p2statetype != L
trigger1 = fvar(3) > 0
trigger1 = p2movetype = H
trigger1 = stateno = 450 && prevstateno = 410 ;After sending out a Power Wave(?)
trigger1 = animelem = 10


;Buster Wolf (Mark of the Wolves)
[State -1, AI]
type = ChangeState
value = 201
triggerall = roundstate = 2
triggerall = var(59) > 0
triggerall = statetype != A
triggerall = p2statetype != L
triggerall = fvar(3) = 0
trigger1 = p2movetype = H
trigger1 = stateno = 420 && movehit && hitcount = 2 ;Hit confirmed with Crouch Heavy Punch

;Buster Wolf (Mark of the Wolves)
[State -1, AI]
type = ChangeState
value = 200
triggerall = roundstate = 2
triggerall = var(59) > 0
triggerall = statetype != A
triggerall = p2statetype != L
triggerall = fvar(3) = 0
trigger1 = stateno = 450 && prevstateno = 410 ;After sending out a Power Wave(?)
trigger1 = animelem = 10

;Are You Okay?
[State -1, AI]
type = ChangeState
value = 196
triggerall = enemy, life > 100
triggerall = roundstate = 2
triggerall = var(59) > 0
triggerall = statetype != A
triggerall = p2statetype != L
triggerall = fvar(3) < 1
triggerall = p2movetype = H
triggerall = !win
trigger1 = stateno = 205 && movehit
trigger2 = stateno = 225 && movehit
trigger3 = stateno = 235 && movehit && hitcount > 1
trigger4 = stateno = 245 && movehit

;-------------

;Buster Wolf (KOF XIII)
[State -1, AI]
type = ChangeState
value = 220
triggerall = roundstate = 2
triggerall = var(59) > 0
triggerall = statetype != A
triggerall = p2statetype != L
trigger1 = fvar(3) = 0
trigger1 = p2movetype = H
trigger1 = stateno = 215 && movehit ;Hit confirmed with Buster Wolf (KoF 2003)

;-------------

;Air Medium Kick
[State -1, AI]
type = ChangeState
value = 640
triggerall = statetype = A
triggerall = p2statetype = A
Triggerall = var(59) > 0
triggerall = AIlevel >= 1
triggerall = roundstate = 2
trigger1 = stateno = 630 && movehit ;Hit confirmed with Air Light Kick

;Air Medium Kick
[State -1, AI]
type = ChangeState
value = 660
triggerall = statetype = A
triggerall = p2statetype = A
Triggerall = var(59) > 0
triggerall = AIlevel >= 1
triggerall = roundstate = 2
trigger1 = stateno = 640 && movehit ;Hit confirmed with Air Mediun Kick

;-------------

;Crouch Medium Kick
[State -1, AI]
type = ChangeState
value = 440
triggerall = roundstate = 2
triggerall = var(59) > 0
triggerall = statetype != A
triggerall = p2statetype != L
trigger1 = stateno = 430 && movehit ;Hit confirmed with Crouch Medium Punch
trigger1 = p2life = 2

;Crouch Medium Kick Part 2
[State -1, AI]
type = ChangeState
value = 444
triggerall = roundstate = 2
triggerall = var(59) > 0
triggerall = statetype != A
triggerall = p2statetype != L
trigger1 = stateno = 440 && movehit ;Hit confirmed with Crouch Medium Punch
trigger1 = p2life = 1