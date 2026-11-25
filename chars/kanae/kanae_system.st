;Super BG Helper
[Statedef 9000]
type = A
physics = N
movetype = I
anim = 9000

[State 9000, Ring]
type = explod
trigger1 = !time
anim = 10002
ID = 9001
pos = 5,-67
supermovetime = 999999
pausemovetime = 999999
scale = const(size.xscale),const(size.yscale)
sprpriority = 7
ownpal = 1
facing = root,facing
ignorehitpause = 1

[State 9000, Decider]
type = varset
trigger1 = 1
var(1) = random%6

[State 9000, Flying Stuff]
type = explod
trigger1 = var(1)<=1
anim = 10000+var(1)
ID = 9000
pos = 25,120
postype = front
vel = facing*-25,0
random = 0,240
removetime = 30
supermovetime = 30
pausemovetime = 30
scale = const(size.xscale),const(size.yscale)
sprpriority = ifelse(var(1),3,-3)
ownpal = 1
facing = root,facing
removeongethit = 1
ignorehitpause = 1
persistent = 1

[State 9000, Unnoticed]
type = playerpush
trigger1 = 1
value = 0

[State 9000, Screenbound]
type = screenbound
trigger1 = 1
value = 0
movecamera = 0,0

[State 9000, Background]
type = assertspecial
trigger1 = 1
flag = globalnoshadow
flag2 = noBG
flag3 = noFG

[State 9000, End]
type = changestate
value = 9001
trigger1 = root, movetype = H
trigger2 = root, numhelper(9000) = 2
trigger3 = root, ctrl = 1

[Statedef 9001]
type = A
movetype = I
physics = N
sprpriority = 0

[State 9001, Noshadow]
type = assertspecial
trigger1 = 1
flag = noshadow

[State 9001, Die]
type = removeexplod
trigger1 = !time
ID = 9000

[State 9001, Die]
type = destroyself
trigger1 = !time

;Hyper BG Helper
[Statedef 9002]
type = A
physics = N
movetype = I
anim = 9000

[State 9002, Ring]
type = explod
trigger1 = !time
anim = 10002
ID = 9001
pos = 5,-67
supermovetime = 999999
pausemovetime = 999999
scale = const(size.xscale),const(size.yscale)
sprpriority = 7
ownpal = 1
facing = root,facing
ignorehitpause = 1

[State 9002, Hyper]
type = explod
trigger1 = !time
anim = 3300
ID = 9000
pos = -160,0
postype = left
bindtime = 1000
removetime = -1
supermovetime = 999999
pausemovetime = 999999
scale = const(size.xscale),const(size.yscale)
sprpriority = -7
ownpal = 1
ignorehitpause = 1

[State 9002, Decider]
type = varset
trigger1 = 1
var(1) = random%6

[State 9002, Unnoticed]
type = playerpush
trigger1 = 1
value = 0

[State 9002, Screenbound]
type = screenbound
trigger1 = 1
value = 0
movecamera = 0,0

[State 9002, Background]
type = assertspecial
trigger1 = 1
flag = globalnoshadow
flag2 = noBG
flag3 = noFG

[State 9002, End]
type = changestate
value = 9001
trigger1 = root, movetype = H
trigger2 = root, ctrl = 1

;Hitspark Generator
[Statedef 10000]
type = A
physics = N
movetype = I
anim = 9000

[State 10000, Unnoticed]
type = playerpush
trigger1 = 1
value = 0

[State 10000, Screenbound]
type = screenbound
trigger1 = 1
value = 0
movecamera = 0,0

[State 10000, Angle Randomizer]
type = varset
trigger1 = !time
var(1) = random%120

[State 10000, Ring]
type = Explod
trigger1 = !time
anim = 10003
scale = const(size.xscale),const(size.yscale)
pausemovetime = 999999
supermovetime = 999999
sprpriority = 7

[State 10000, Red Stuff Generator]
type = helper
trigger1 = !time
stateno = 10002
name = "Generator"
ID = 10005
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 10000, Make Spark]
type = helper
trigger1 = !time
stateno = 10001
name = "Hitspark"
ID = 10001
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 10000, Make Spark]
type = helper
trigger1 = !time
stateno = 10001
name = "Hitspark"
ID = 10002
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 10000, Make Spark]
type = helper
trigger1 = !time
stateno = 10001
name = "Hitspark"
ID = 10003
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 10000, Noshadow]
type = assertspecial
trigger1 = 1
flag = noshadow

[State 10000, Done]
type = destroyself
trigger1 = time = 1

;The hitspark itself
[Statedef 10001]
anim = 10004
sprpriority = 6

[State 10001, Noshadow]
type = assertspecial
trigger1 = 1
flag = noshadow

[State 10001, Set Angle]
type = varset
trigger1 = !time
trigger1 = ishelper(10001)
var(1) = parent,var(1)

[State 10001, Set Angle]
type = varset
trigger1 = !time
trigger1 = ishelper(10002)
var(1) = parent,var(1)+120

[State 10001, Set Angle]
type = varset
trigger1 = !time
trigger1 = ishelper(10003)
var(1) = parent,var(1)+240

[State 10001, Trans]
type = trans
trigger1 = time < 9
trans = add

[State 10001, Fade]
type = trans
trigger1 = time = [9,13]
trans = addalpha
alpha = ceil((14-time)*256/6.0),256

[State 10001, Angleset]
type = angleset
trigger1 = 1
value = var(1)

[State 10001, Angledraw]
type = angledraw
trigger1 = 1
scale = (time+26.0)/39.0,(time+26.0)/39.0

[State 10001, Destroyself]
type = destroyself
trigger1 = !animtime

;Generator
[Statedef 10002]
type = A
physics = N
movetype = I
anim = 9000

[State 10002, Unnoticed]
type = playerpush
trigger1 = 1
value = 0

[State 10002, Noshadow]
type = assertspecial
trigger1 = 1
flag = noshadow

[State 10002, Screenbound]
type = screenbound
trigger1 = 1
value = 0
movecamera = 0,0

[State 10002, Make Spark]
type = helper
trigger1 = !time
stateno = 10003
name = "Spark"
ID = 10006 + ishelper(10006)
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 10002, Varadd]
type = varadd
trigger1 = !time
var(1) = 1

[State 10002, loop]
type = changestate
trigger1 = var(1) < 18
value = 10002

[State 10002, End]
type = destroyself
trigger1 = 1

;The spark itself
[Statedef 10003]
type = A
physics = N
movetype = I
anim = ifelse(ishelper(10007),10015,10009)
velset = -3*(random/500.0),-1*(random/333.0)
sprpriority = 4

[State 10003, Noshadow]
type = assertspecial
trigger1 = 1
flag = noshadow

[State 10003, Gravity]
type = veladd
trigger1 = 1
y = .44

[State 10003, vector]
type = varset
trigger1 = 1
fvar(1) = ((vel Y**2)+(vel x**2))**0.5

[State 10003, Set]
type = AngleSet
trigger1 = vel X != 0
value = ceil(atan(Vel Y/Vel X)*(-180.0/Pi))

[State 10003, Set]
type = AngleSet
trigger1 = vel X = 0
value = 270

[State whatever, Apply]
type = AngleDraw
trigger1 = 1
scale = fvar(1)*5,1

[State 10003, Trans]
type = trans
trigger1 = 1
trans = add

[State 10003, bounce]
type = velset
trigger1 = vel y > 0
trigger1 = pos y >= 0
trigger1 = random = [0,100]
y = -.4*vel y

[State 10003, Destroy]
type = destroyself
trigger1 = time = 35


;Reflect Spark Generator
[Statedef 10010]
type = A
physics = N
movetype = I
anim = 9000

[State 10010, Noshadow]
type = assertspecial
trigger1 = 1
flag = noshadow

[State 10010, Unnoticed]
type = playerpush
trigger1 = 1
value = 0

[State 10010, Screenbound]
type = screenbound
trigger1 = 1
value = 0
movecamera = 0,0

[State 10010, Ring]
type = Explod
trigger1 = !time
anim = 10013
scale = const(size.xscale),const(size.yscale)
pausemovetime = 999999
supermovetime = 999999
sprpriority = 7

[State 10010, Rainbow Stuff Generator]
type = helper
trigger1 = !time
stateno = 10013
name = "Generator"
ID = 10013
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 10010, Make Star]
type = helper
trigger1 = !time
stateno = 10011
name = "Hitspark"
ID = 10012
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 10010, Make RGB]
type = helper
trigger1 = !time
stateno = 10011
name = "Hitspark"
ID = 10011
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 10000, Done]
type = destroyself
trigger1 = time = 1

;Expanding RGB/Star
[Statedef 10011]
anim = 10011+ishelper(10012)
sprpriority = 6

[State 10011, Noshadow]
type = assertspecial
trigger1 = 1
flag = noshadow

[State 10011, Trans]
type = trans
trigger1 = time < 15
trans = add

[State 10011, Fade]
type = trans
trigger1 = time = [15,20]
trans = addalpha
alpha = ceil((20-time)*256/5.0),256

[State 10011, Angledraw]
type = angledraw
trigger1 = 1
scale = (time+40.0)/40.0,(time+40.0)/40.0

[State 10011, Destroyself]
type = destroyself
trigger1 = time = 21

;Rainbow Generator
[Statedef 10013]
type = A
physics = N
movetype = I
anim = 9000

[State 10013, Noshadow]
type = assertspecial
trigger1 = 1
flag = noshadow

[State 10013, Unnoticed]
type = playerpush
trigger1 = 1
value = 0

[State 10013, Screenbound]
type = screenbound
trigger1 = 1
value = 0
movecamera = 0,0

[State 10013, Make Spark]
type = helper
trigger1 = !time
stateno = 10014
name = "Spark"
ID = 10014
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 10013, Varadd]
type = varadd
trigger1 = !time
var(1) = 1

[State 10013, loop]
type = changestate
trigger1 = var(1) < 18
value = 10013

[State 10013, End]
type = destroyself
trigger1 = 1

;The spark itself
[Statedef 10014]
type = A
physics = N
movetype = I
anim = 10010
velset = 0,0
sprpriority = 4

[State 10014, Noshadow]
type = assertspecial
trigger1 = 1
flag = noshadow

[State 10003, vector]
type = varset
trigger1 = !time
fvar(1) = (random/1000.0)*5.0+2

[State 10003, Angle]
type = varset
trigger1 = !time
var(1) = random%360

[State 10003, Velocity]
type = velset
trigger1 = !time
x = fvar(1)*cos(var(1)*pi/180.0)
y = -1*fvar(1)*sin(var(1)*pi/180.0)

[State 10003, Set]
type = AngleSet
trigger1 = 1
value = var(1)

[State whatever, Apply]
type = AngleDraw
trigger1 = 1
scale = (time/32.0)+1.0,1.0

[State 10003, Trans]
type = trans
trigger1 = 1
trans = addalpha
alpha = (16-time)*16,256

[State 10014, Destroy]
type = destroyself
trigger1 = time = 16

;Ground Hit Spark
[Statedef 10015]
type = A
physics = N
movetype = I
anim = 9000

[State 10015, Noshadow]
type = assertspecial
trigger1 = 1
flag = noshadow

[State 10015, Unnoticed]
type = playerpush
trigger1 = 1
value = 0

[State 10015, Screenbound]
type = screenbound
trigger1 = 1
value = 0
movecamera = 0,0

[State 10015, Angle Randomizer]
type = varset
trigger1 = !time
var(1) = random%120

[State 10015, Ring]
type = Explod
trigger1 = !time
anim = 10003
scale = const(size.xscale),const(size.yscale)
pausemovetime = 999999
supermovetime = 999999
sprpriority = 7

[State 10015, Make Spark]
type = helper
trigger1 = !time
stateno = 10001
name = "Hitspark"
ID = 10001
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 10015, Make Spark]
type = helper
trigger1 = !time
stateno = 10001
name = "Hitspark"
ID = 10002
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 10015, Make Spark]
type = helper
trigger1 = !time
stateno = 10001
name = "Hitspark"
ID = 10003
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 10015, Done]
type = destroyself
trigger1 = time = 1

;Rocks
[Statedef 10016]
type = A
physics = N
movetype = I
anim = 9000

[State 10016, Noshadow]
type = assertspecial
trigger1 = 1
flag = noshadow

[State 10016, Unnoticed]
type = playerpush
trigger1 = 1
value = 0

[State 10016, Screenbound]
type = screenbound
trigger1 = 1
value = 0
movecamera = 0,0

[State 10016, Rock]
type = helper
trigger1 = !time
stateno = 10017
name = "Rock"
ID = 10017+ishelper(10018)
pos = (random%21-10),-1*(random%8)
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 10016, Varadd]
type = varadd
trigger1 = !time
var(1) = 1

[State 10016, loop]
type = changestate
trigger1 = var(1) < 4+random%3 + 2*ishelper(10018)
value = 10016

[State 10016, Done]
type = destroyself
trigger1 = 1

;Rock
[Statedef 10017]
type = A
movetype = I
physics = N
anim = 10005 + random%4

[State 10017, Vel]
type = velset
trigger1 = !time
x = (random%100)/-25.0 +(2*ishelper(10018))
y = (random%21)/-2.0-4.0

[State 10017, Spin]
type = varset
trigger1 = !time
v = 1
value = random%10+1

[State 10017, Spin]
type = AngleSet
trigger1 = (var(2):=(var(2)+var(1)))||e
value = var(2)

[State 10017, Reduce]
type = null
trigger1 = var(2) >= 360
trigger1 = var(2) := var(2)-360
trigger2 = var(2) < 0
trigger2 = var(2) := var(2)+360

[State 10017, Draw]
type = AngleDraw
trigger1 = 1

[State 10017, Physics]
type = varset
triggerall = vel Y > 0
triggerall = pos Y >= 0
trigger1 = var(2) = [0,45]
trigger1 = var(1) > 0
trigger2 = var(2) = [315,360]
trigger2 = var(1) < 0
trigger3 = var(2) = [180,225]
trigger3 = var(1) > 0
trigger4 = var(2) = [135,180]
trigger4 = var(1) < 0
v = 1
value = ceil(-.5*var(1))

[State 10017, Physics]
type = velset
trigger1 = vel Y > 0
trigger1 = pos Y >= 0
y = vel Y*-.3

[State 10017, Physics]
type = veladd
trigger1 = pos Y < 0
y = .68

[State 10017, Fade]
type = trans
trigger1 = time = [37,46]
trans = addalpha
alpha = (47-time)*23,255

[State 10017, Die]
type = destroyself
trigger1 = time = 47
trigger2 = pos X > 180
trigger3 = pos X < -180

;Dust
[Statedef 10018]
type = A
physics = N
movetype = I
anim = 9000

[State 10018, Noshadow]
type = assertspecial
trigger1 = 1
flag = noshadow

[State 10018, Unnoticed]
type = playerpush
trigger1 = 1
value = 0

[State 10018, Screenbound]
type = screenbound
trigger1 = 1
value = 0
movecamera = 0,0

[State 10018, Cloud]
type = helper
trigger1 = !time
stateno = 10019
name = "Cloud"
ID = 10019+ishelper(10019)
pos = (random%21-10),-1*(random%8)
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 10018, Varadd]
type = varadd
trigger1 = !time
var(1) = 1

[State 10018, loop]
type = changestate
trigger1 = var(1) < 4+random%5
value = 10018

[State 10018, Done]
type = destroyself
trigger1 = 1

;Cloud
[Statedef 10019]
type = A
movetype = I
physics = N
anim = 10014

[State 10019, Noshadow]
type = assertspecial
trigger1 = 1
flag = noshadow

[State 10019, Background]
type = assertspecial
trigger1 = 1
flag = noshadow

[State 10019, Vel]
type = velset
trigger1 = !time
trigger1 = ishelper(10019)
x = (random%51)/-25.0 + 1.0
y = (random%21)/-9.0 - .3

[State 10019, Vel]
type = velset
trigger1 = !time
trigger1 = ishelper(10020)
x = (random%51)/-25.0 + 1.0
y = (random%11)/-9.0 - .3

[State 10019, Pos]
type = posadd
trigger1 = !time
trigger1 = ishelper(10020)
x = (random%51)-25

[State 10019, Spin]
type = varset
trigger1 = !time
v = 1
value = ifelse(random%2,-1,1)

[State 10019, Spin]
type = AngleAdd
trigger1 = time
value = var(1)

[State 10019, Fade]
type = trans
trigger1 = time = [0,33]
trigger1 = ishelper(10019)
trans = addalpha
alpha = ceil((34-time)*7.5),255

[State 10019, Fade]
type = trans
trigger1 = time = [0,17]
trigger1 = ishelper(10020)
trans = addalpha
alpha = ceil((18-time)*7.5),255

[State 10019, Draw]
type = AngleDraw
trigger1 = 1

[State 10019, Die]
type = destroyself
trigger1 = ishelper(10019)
trigger1 = time = 34
trigger2 = ishelper(10020)
trigger2 = time = 18

;Guardspark Generator
[Statedef 10020]
type = A
physics = N
movetype = I
anim = 9000

[State 10020, Unnoticed]
type = playerpush
trigger1 = 1
value = 0

[State 10020, Screenbound]
type = screenbound
trigger1 = 1
value = 0
movecamera = 0,0

[State 10020, Ring1]
type = Explod
trigger1 = !time
anim = 10016
scale = const(size.xscale),const(size.yscale)
pausemovetime = 999999
supermovetime = 999999
sprpriority = 7

[State 10020, Ring2]
type = Explod
trigger1 = time = 3
anim = 10016
scale = const(size.xscale),const(size.yscale)
pausemovetime = 999999
supermovetime = 999999
sprpriority = 7

[State 10020, Ring3]
type = Explod
trigger1 = time = 6
anim = 10016
scale = const(size.xscale),const(size.yscale)
pausemovetime = 999999
supermovetime = 999999
sprpriority = 7

[State 10020, Blue Stuff Generator]
type = helper
trigger1 = !time
stateno = 10002
name = "Generator"
ID = 10006
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 10020, Noshadow]
type = assertspecial
trigger1 = 1
flag = noshadow

[State 10020, Done]
type = destroyself
trigger1 = time = 6


;---------------------------------------------------------------------------
; States that are executed when in self's state file (use statedef -3)
;---------------------------------------------------------------------------

[Statedef -3]

;Taken from PotS' Cammy with KoopaKoot's fix.
[State -3, Prevent Crossup]
type=width
triggerall = stateno != 3200
trigger1= statetype = A
trigger1 = movetype != H
trigger2 = movetype = A
edge= 8, 0
ignorehitpause=1

[State -3, SetAI]
type = VarSet
triggerall = Alive && !IsHelper
triggerall = IsHomeTeam
trigger1 = TeamSide = 2
trigger2 = MatchNo > 1
var(58) = 1

[State -3, AI Helper - Compatibly Partnered Version]
type = Helper
trigger1 = !var(58) && !IsHelper
trigger1 = !NumHelper(9742)
trigger1 = Alive && RoundState = 2
trigger1 = NumPartner
trigger1 = Partner,SelfAnimExist(9741)
HelperType = normal
name = "AI Helper (Simul Version)"
ID = 9742
pos = 9999999,99999
StateNo = 9742
KeyCtrl = 1
PauseMoveTime = 2147483647
SuperMoveTime = 2147483647

; If you want to use the Guard mode, Dummy mode, Distance, or Button jam dummy
; control options in Training mode without activating the dummy's AI while
; working on the character, then all you need to do is temporarily disable
; this controller.  Or, if you want to permanently disable this controller in
; Training mode, then you could use the Training mode detection code available
; from my site ( http://www.mugenguild.net/~winane/ ), and then just add a
; "(var(59)&63)>30" triggerall to this controller.
; Alternatively, you can just set "Dummy control" to "Manual", press a P2 button
; to kill the AI helper, and then set dummy control back to "Cooperative".  (In
; fact, setting dummy control to manual isn't even necessary, if you press the
; P2 button prior to the first time you pause.)
[State -3, AI Helper]
type = Helper
triggerall = !var(58) && !IsHelper
triggerall = !NumHelper(9741)
triggerall = Alive && RoundState = 2
trigger1 = !NumPartner
trigger2 = !(Partner,SelfAnimExist(9741))
HelperType = normal
name = "AI Helper"
ID = 9741
pos = 9999999,99999
StateNo = 9741
KeyCtrl = 1
PauseMoveTime = 2147483647
SuperMoveTime = 2147483647

[State -3, TurnBackOnAI]
type = VarSet
trigger1 = var(58) = -2 && !IsHelper
trigger1 = Alive && RoundState = 2
var(58) = 1

; This method works somewhat in Linux Mugen version 2002.04.14,
; whereas the old humanly-impossible commands method does not.
; It is very important that this controller NOT be moved to State -2.
; Note that this part won't work nearly as well if AI.Cheat is turned off
; in mugen.cfg.
[State -3, XOR]
type = VarSet
triggerall = var(58)!=1 && !IsHelper
triggerall = !var(56)
triggerall = var(57) = GameTime-1
trigger1 = command = "b" ^^ command = "b2"
trigger2 = command = "x" ^^ command = "x2"
trigger3 = command = "y" ^^ command = "y2"
trigger4 = command = "z" ^^ command = "z2"
trigger5 = command = "holdb" ^^ command = "holdb2"
trigger6 = command = "holdx" ^^ command = "holdx2"
trigger7 = command = "holdy" ^^ command = "holdy2"
trigger8 = command = "holdz" ^^ command = "holdz2"
trigger9 = command = "holdfwd" ^^ command = "holdfwd2"
trigger10 = command = "holdback" ^^ command = "holdback2"
trigger11 = command = "holdup" ^^ command = "holdup2"
trigger12 = command = "holddown" ^^ command = "holddown2"
;Add more as desired. (See my notes in the CMD.)
var(58) = 1

; These next two controllers must be placed here, after the above XOR
; VarSet controller and before the below GameTime VarSet controller.
[State -3, fiXOR]
type = VarAdd
trigger1 = var(56) > 0 && !IsHelper
var(56) = -1

[State -3, fuXOR]
type = VarSet
trigger1 = var(57) < GameTime-1 && !IsHelper
var(56) = 31
IgnoreHitPause = 1

; It is very important that this controller NOT be moved to State -2, as putting
; it there would defeat the entire purpose of the controller, allowing the
; helper method or the XOR method to erroneously set the AI variable.
; And within State -3, don't put any ChangeState controllers before this
; controller, lest you unnecessarily delay your character's AI activation.
[State -3, GameTimeVar]
type = VarSet
trigger1 = !IsHelper
var(57) = GameTime
IgnoreHitPause = 1


;---------------------------------------------------------------------------
; States that are always executed (use statedef -2)
;---------------------------------------------------------------------------
[Statedef -2]

[State -2, StopAI]
type = VarSet
triggerall = var(58) > 0 && !IsHelper
trigger1 = RoundState != 2
trigger2 = !Alive
var(58) = -2
IgnoreHitPause = 1

[State -2, Simplifier]
type = VarSet
triggerall = !IsHelper
trigger1 = var(58) = 1
trigger2 = var(0):=0
var(0) = 1	; Another option is to replace 1 with something like MatchNo, if
		; you want to design your AI to have varying levels of difficulty.
IgnoreHitPause = 1

[State -2, Guts]
type = varset
trigger1 = (enemynear,life) > (enemynear,lifemax)*.25
fvar(2) = 0.75 + .25*(enemynear,life)/(enemynear,lifemax)

[State -2, Guts]
type = varset
trigger1 = (enemynear,life) <= (enemynear,lifemax)*.25
fvar(2) = 0.5 + 2.0*(enemynear,life)/(enemynear,lifemax)

[State -2, Combo]
type = varset
trigger1 = numtarget
trigger1 = target, gethitvar(hitcount) >= 3
fvar(3) = .25

[State -2, Combo]
type = varset
trigger1 = numtarget
trigger1 = target, gethitvar(hitcount) = 2
fvar(3) = .5

[State -2, Combo]
type = varset
trigger1 = numtarget
trigger1 = target, gethitvar(hitcount) = 1
fvar(3) = .75

[State -2, Combo]
type = varset
trigger1 = !numtarget
trigger2 = numtarget
trigger2 = target, gethitvar(hitcount) = 0
fvar(3) = 1

;================================================================================
; ------- COUNTER HIT (Based on Sander's Method) --------
;===============================================================================
[State -2, VarSet];Checks if opponent is in attack state
type = VarSet
triggerall = numenemy
trigger1 = enemy, movetype = a
fvar(4) = 1.25
ignorehitpause = 1

[State -2, VarSet];This resets the condition if counter not succesful and succesful
type = VarSet
triggerall = numenemy
trigger1 = enemy, movetype = i || var(3) >= 1  ;Enemy is Idle | Counter was Succesful
trigger2 = var(3) > 10 && enemy, movetype = h  ;10 ticks passed & enemy is on gethit state
fvar(4) = 1
ignorehitpause = 1

[State -2, VarSet];Counter Hit Succesful
type = VarSet
trigger1 = fvar(4) = 1.25 && movehit ;Counter Check Ok, Move Hit Succesfully.
trigger2 = fvar(4) = 1.25 && projhit = 1  ;Counter Check Ok, Projectile Hit Succesfully.
var(3) = 1
ignorehitpause = 1

[State -2, VarAdd];Counter Hit Timer
type = VarAdd
trigger1 = var(3) >= 1 ;Counter was succesful
var(3) = 1
ignorehitpause = 1

[State -2, VarSet];Counter Hit Reset
type = VarSet
trigger1 = var(3) >= 22 && movehit ;Reset if 22 ticks passed and move hit
trigger2 = p2movetype != h ;Reset if P2 is no longer in gethit state
trigger3 = movetype = h ;Reset if P1 is getting hit
trigger4 = var(3) >= 22 && projhit = 1 ;Reset if 22 ticks passed and projectile hit
var(3) = 0
ignorehitpause = 1

[State -2, Varset]
type = varset
trigger1 = 1
fvar(5) = fvar(2)*fvar(3)*fvar(4)*ifelse(enemynear,facing = facing,1.5,1)

;-----------------------------------
;Dust on fall

[State -2, Dust]
type = helper
trigger1 = stateno = [5100,5110]
trigger1 = time = 1
name = "Dust Helper"
ID = 10019
pos = 0,0
stateno = 10018
ownpal = 1
pausemovetime = 999

;---------------------------------------------------------------------------
; PotS Safe Fall Fix
;---------------------------------------------------------------------------
[State -2, P2 Safe Fall]
type= targetstate
trigger1= numtarget=1; Just to prevent Simul mode shenanigans
trigger1= target,command="recovery"
trigger1= target,pos y>=-20 && target,vel y>0
trigger1= target,alive && target,hitfall && target,gethitvar(fall.recover)
trigger1= target,stateno=5030 || target,stateno=5035 || target,stateno=5050 || target,stateno=5071
value= 5205
ignorehitpause= 1

[Statedef 5205]
type= A
physics= N
movetype= H
 
[State 5205, End]; Sends character back to his own recovery states
type= selfstate
trigger1= 1
value= ifelse(pos y<-20, 5210, 5200)