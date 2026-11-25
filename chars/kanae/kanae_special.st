;------------------------------------------------------
;Command Throw
[Statedef 1002]
type = S
movetype = I
physics = N
ctrl = 0
sprpriority = 2
facep2 = 1
anim = 1002

[State 1002, Snd]
type = PlaySnd
trigger1 = !time
value = 100,0

[State 1002, Dust]
type = helper
trigger1 = !time
name = "Dust Helper"
ID = 10019
pos = 0,0
stateno = 10019
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 1002, Advance]
type = velset
trigger1 = animelemtime(2) = 0
x = 5.5

[State 1002, Friction]
type = veladd
trigger1 = animelemtime(2) >= 0
x = -.005

[State 1002, Grab]
type = changestate
trigger1 = animelemtime(11) = 1
value = 1000

[Statedef 1001]
type = S
movetype = I
physics = N
ctrl = 0
sprpriority = 2
facep2 = 1
anim = 1001

[State 1001, Snd]
type = PlaySnd
trigger1 = !time
value = 100,0

[State 1001, Dust]
type = helper
trigger1 = !time
name = "Dust Helper"
ID = 10019
pos = 0,0
stateno = 10019
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 1001, Advance]
type = velset
trigger1 = animelemtime(2) = 0
x = 5.5

[State 1001, Friction]
type = veladd
trigger1 = animelemtime(2) >= 0
x = -.005

[State 1001, Grab]
type = changestate
trigger1 = animelemtime(9) = 1
value = 1000

[Statedef 1000]
type = S
movetype = A
physics = S
ctrl = 0
sprpriority = 2
velset = 0,0

[State 1000, Cancel]
type = varset
trigger1 = !time
v = 2
value = 0

[State 1000, Voice]
type = PlaySnd
trigger1 = !time
value = 1000,0
channel = 0

[State 1000, Anim]
type = changeanim
trigger1 = !time
trigger1 = prevstateno != [1001,1002]
value = 1000

[State 1000, Throw]
type = hitdef
triggerall = p2bodydist X <= 48
triggerall = enemynear, stateno != [150,152]
triggerall = enemynear, stateno != 40
trigger1 = anim = 1000
trigger1 = animelemtime(2) = 0
trigger2 = anim = 1001
trigger2 = animelemtime(10) = 0
trigger3 = anim = 1002
trigger3 = animelemtime(12) = 0
attr = S,ST
hitflag = M
guardflag = 
guard.dist = -1
priority = 1, miss
sparkno = -1
sparkxy = -10,-85
hitsound = S800,2
fall = 1
fall.recover = 0
yaccel = .68
getpower = 0,0
givepower = 0,0
p1stateno = 1005
p2stateno = 1006
p2facing = 1

[State 1000, Throw]
type = null
triggerall = p2bodydist X <= 48
triggerall = enemynear, stateno != [150,152]
triggerall = enemynear, stateno != 40
trigger1 = prevstateno = 200
trigger2 = prevstateno = 400
trigger3 = prevstateno = 230
attr = S,ST
hitflag = M
guardflag = 
guard.dist = -1
priority = 1, miss
sparkno = -1
sparkxy = -10,-85
hitsound = -1
fall = 1
fall.recover = 0
yaccel = .68
getpower = 0,0
givepower = 0,0
p1stateno = 1005
p2stateno = 1006

[State 1000, Miss]
type = statetypeset
trigger1 = time = 4
movetype = I

[State 1000, Miss]
type = changestate
trigger1 = animtime = 0
value = 0
ctrl = 1

[Statedef 1005]
type = S
movetype = A
physics = N
sprpriority = 2
anim = 1005

[State 1005, Whoosh]
type = playsnd
trigger1 = animelemtime(4) = 0
trigger1 = anim = 1005
value = 1,0

[State 1005, Width]
type = width
trigger1 = time = 1
edge = 30,30

[State 1005, Toss]
type = changeanim
trigger1 = time = 51
value = 1006

[State 1005, poweradd]
type = poweradd
trigger1 = anim = 1006
value = 160
persistent = 0

[State 1005, Voice]
type = playsnd
trigger1 = anim = 1006
value = 640,0
persistent = 0
channel = 0

[State 1005, Cancel]
type = varset
trigger1 = anim = 1006
trigger1 = animelemtime(6) = -1
v = 2
value = 1

[State 1005, poweradd]
type = poweradd
trigger1 = anim = 1006
trigger1 = animtime = 0
value = 80
persistent = 0

[State 1005, End]
type = changestate
trigger1 = anim = 1006
trigger1 = animtime = 0
value = 0
ctrl = 1

[Statedef 1006]
type = A
movetype = H
physics = N
sprpriority = 1
velset = 0,0
facep2 = 1

[State 1006, Afterimages]
type = AfterImage
trigger1 = time = 0
time = 50
length = 10
timegap = 1
framegap = 2
paladd = 0,0,0
palmul = 1,1,1
palbright = 0,0,0
palcontrast = 200,200,200
trans = addalpha
alpha = 150,255

[State 1006, Screenbound]
type = screenbound
trigger1 = 1
movecamera = 1,0

[State 1006, Anim]
type = changeanim2
trigger1 = !time
value = 806

[State 1006, turn]
type = turn
trigger1 = time = 6
trigger2 = time = 14
trigger3 = time = 22
trigger4 = time = 30
trigger5 = time = 38
trigger6 = time = 46

[State 1006, Sprpriority]
type = sprpriority
trigger1 = time = 6
trigger2 = time = 22
trigger3 = time = 38
value = 1

[State 1006, Sprpriority]
type = sprpriority
trigger1 = time = 14
trigger2 = time = 30
trigger3 = time = 46
value = 3

[State 1006, move]
type = velset
trigger1 = !time
x = (p2dist X-55) / 6

[State 1006, move]
type = velset
trigger1 = time = 7
trigger2 = time = 15
trigger3 = time = 23
trigger4 = time = 31
trigger5 = time = 39
trigger6 = time = 47
x=-11.5

[State 1006, snap]
type = posadd
trigger1 = time = 50
y = -64

[State 1006, Anim]
type = changeanim2
trigger1 = time = 50
value = 1003

[State 1006, move]
type = velset
trigger1 = time = 50
x=-5
y=-15

[State 1006, Stop]
type = velset
trigger1 = backedgebodydist <= 0
trigger1 = vel x < 0
x = 0

[State 1006, Stop]
type = velset
trigger1 = frontedgebodydist <= 0
trigger1 = vel x > 0
x = 0

[State 1006, poweradd]
type = poweradd
trigger1 = time = 50
value = 80
persistent = 0

[State 1006, air friction]
type = veladd
trigger1 = time >= 50
y = .815

[State 1006, air friction]
type = veladd
trigger1 = time >= 50
trigger1 = vel x < 0
x = .05

[State 1006, angle change]
type = angleset
trigger1 = time >= 50
value = 90+(time-50)*45

[State 1006, draw]
type = angledraw
trigger1 = time >= 50

[State 1005, Damage]
type = Lifeadd
trigger1 = time = 51
value = ceil(-111*(enemy,fvar(2))*(ifelse(gethitvar(hitcount)>=4,.25,ifelse(gethitvar(hitcount)=3,.5,ifelse(gethitvar(hitcount)=2,.75,1)))))

[State 1006, Damage]
type = Lifeadd
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
value = ceil(-56*(enemy,fvar(5)))

[State 1006, Envshake]
type = Envshake
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 1006, poweradd]
type = poweradd
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
value = 40
persistent = 0

[State 1006, Land]
type = SelfState
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
value = 5100



;-------------------------------------------------------------------
;Anti-Air throw start
[Statedef 1100]
type = S
movetype = I
physics = S
velset = 0,0
facep2 = 1
ctrl = 0
anim = 1100

[State 1100, LEAP]
type = velset
trigger1 = animtime = 0
x = 0

[State 1100, Voice]
type = PlaySnd
trigger1 = animtime = 0
value = 1050,0
channel = 0

[State 1100, LEAP]
type = changestate
trigger1 = animtime = 0
value = 1103

[Statedef 1101]
type = S
movetype = I
physics = S
velset = 0,0
facep2 = 1
ctrl = 0
anim = 1100

[State 1101, LEAP]
type = velset
trigger1 = animtime = 0
x = 4

[State 1101, Voice]
type = PlaySnd
trigger1 = animtime = 0
value = 1050,0
channel = 0

[State 1101, LEAP]
type = changestate
trigger1 = animtime = 0
value = 1103

[Statedef 1102]
type = S
movetype = I
physics = S
velset = 0,0
facep2 = 1
ctrl = 0
anim = 1100

[State 1102, LEAP]
type = velset
trigger1 = animtime = 0
x = 7.5

[State 1100, Voice]
type = PlaySnd
trigger1 = animtime = 0
value = 1050,0
channel = 0

[State 1102, LEAP]
type = changestate
trigger1 = animtime = 0
value = 1103

[Statedef 1103]
type = A
movetype = A
physics = N
anim = prevstateno+1

[State 1103, Jump]
type = velset
trigger1 = !time
y = -10

[State 1103, Whoosh]
type = PlaySnd
trigger1 = pos Y < 0
value = 1,0
persistent = 0

[State 1103, Record]
type = varset
trigger1 = !time
sysvar(1) = prevstateno

[State 1103, Air Friction]
type = veladd
trigger1 = vel X > 0
x = -.05

[State 1103, Throw]
type = hitdef
triggerall = animelemtime(3) = 0
trigger1 = anim = 1101
trigger1 = p2bodydist X = [-48,16]
trigger2 = anim = 1102
trigger2 = p2bodydist X = [-32,32]
trigger3 = anim = 1103
trigger3 = p2bodydist X = [-16,48]
attr = A,ST
hitflag = AFD
guardflag = 
guard.dist = -1
priority = 1, miss
sparkno = -1
sparkxy = -10,-85
hitsound = S800,2
fall = 1
fall.recover = 0
yaccel = .68
getpower = 0,0
givepower = 0,0
p1stateno = 1105
p2stateno = 1106
p2facing = 1

[State 1003, Idle]
type = statetypeset
trigger1 = animelemtime(4)=0
movetype = I

[State 1103, Pos Set]
type = Posset
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
y = 0

[State 1103, Gravity]
type = veladd
trigger1 = 1
y = .68

[State 1103, Land]
type = Changestate
trigger1 = time
trigger1 = Pos Y = 0
value = 1107

[Statedef 1105]
type = A
movetype = A
physics = N
sprpriority = 2
anim = 1105

[State 1105, move]
type = velset
trigger1 = !time
x = 5

[State 1105, Gravity]
type = veladd
trigger1 = 1
y = .68

[State 1105, bind]
type = targetbind
trigger1 = 1
pos = 0,-48

[State 1105, Pos Set]
type = Posset
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
y = 0

[State 1105, bind]
type = targetbind
trigger1 = Pos Y = 0
pos = 0,0

[State 1105, poweradd]
type = poweradd
trigger1 = Pos Y = 0
value = 160
persistent = 0

[State 1105, Land]
type = Changestate
trigger1 = Pos Y = 0
value = 1107

[Statedef 1107]
type = S
movetype = I
physics = N
anim = sysvar(1)+7
velset = 0,0

[State 1107, Voice]
type = playsnd
trigger1 = !time
trigger1 = prevstateno = 1105
value = 0,2
channel = 0

[State 1107, Hitsound]
type = playsnd
trigger1 = !time
trigger1 = prevstateno = 1105
value = 10,2

[State 3200, Rocks]
type = helper
trigger1 = !time
trigger1 = prevstateno = 1105
name = "Rock Helper"
ID = 10018
pos = 0,0
stateno = 10016
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 3200, Dust]
type = helper
trigger1 = !time
trigger1 = prevstateno = 1105
name = "Dust Helper"
ID = 10018
pos = 0,0
stateno = 10018
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 1107, VelSet]
type = velset
trigger1 = prevstateno = 1105
x = 5

[State 1107, Anim]
type = changeanim
trigger1 = !time
trigger1 = prevstateno = 1105
value = 1110

[State 1107, Friction]
type = veladd
trigger1 = vel X > 0
x = -.05

[State 1107, Edge]
type = width
trigger1 = prevstateno = 1105
edge = 20, 0

[State 1107, End]
type = changestate
trigger1 = animtime = 0
value = 0
ctrl = 1

[Statedef 1106]
type = A
movetype = H
physics = N
sprpriority = 1

[State 1106, Screenbound]
type = screenbound
trigger1 = 1
movecamera = 1,0

[State 1106, Vel]
type = velset
trigger1 = !time
x = enemynear, vel X
y = enemynear, vel y

[State 1106, Gravity]
type = veladd
trigger1 = 1
y = .68

[State 1106, Anim]
type = changeanim2
trigger1 = !time
value = 1106

[State 1106, Pos Set]
type = Posset
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
y = 0

[State 1106, Vel]
type = velset
trigger1 = Pos Y = 0
x = -1

[State 1106, Damage]
type = lifeadd
trigger1 = Pos Y = 0
value = ceil(-153*(enemy,fvar(2))*(ifelse(gethitvar(hitcount)>=4,.25,ifelse(gethitvar(hitcount)=3,.5,ifelse(gethitvar(hitcount)=2,.75,1)))))

[State 1006, Envshake]
type = Envshake
trigger1 = Pos Y = 0
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 1106, poweradd]
type = poweradd
trigger1 = Pos Y = 0
value = 80
persistent = 0

[State 1106, Land]
type = Selfstate
trigger1 = Pos Y = 0
value = 5100

;------------------------------------------------------------------------
;Counter High
[Statedef 1150]
type = S
movetype = I
physics = S
facep2 = 1
ctrl = 0
anim = 1150
velset = 0,0

[State 1150, Effect]
type = palfx
trigger1 = anim = 1150
time = 1
add = 0,64,192
mul = 0,256,208

[State 1150, Snd]
type = PlaySnd
trigger1 = !time
value = 0,0

[State 1150, Hitoverride]
type = hitoverride
trigger1 = anim = 1150
attr = SC, NA, SA, HA
stateno = 1153

[State 1150, Off]
type = changeanim
trigger1 = animtime = 0
trigger1 = anim = 1150
value = 1153

[State 1150, End]
type = changestate
trigger1 = animtime = 0
trigger1 = anim = 1153
value = 0
ctrl = 1

;Counter!
[Statedef 1153]
movetype = A

[State 1153, Don't counter I lied]
type = changestate
trigger1 = gethitvar(type) = 3
trigger2 = gethitvar(groundtype) = 3
trigger3 = gethitvar(type) = 2
trigger4 = gethitvar(groundtype) = 2
trigger5 = time = 1
value = 5000

[State 1153, Invince]
type = nothitby
trigger1 = 1
value = SCA, AA, AP, AT

[State 1153, Kill those hoes]
type = hitdef
trigger1 = 1
attr = S,ST
hitflag = M
guardflag = 
guard.dist = -1
priority = 7, hit
sparkno = -1
sparkxy = -10,-85
hitsound = S800,1
fall = 1
fall.recover = 0
yaccel = .68
getpower = 0,0
givepower = 0,0
p1stateno = 1154
p2stateno = 1155
p2facing = 1

[Statedef 1154]
type= S
movetype = A
sprpriority = 2
anim = 1156

[State 1154, anim]
type = changeanim
trigger1 = prevstateno = 1151
value = 1157

[State 1154, Whoosh]
type = playsnd
trigger1 = anim = 1156
trigger1 = animelemtime(4) = 0
value = 1,0

[State 1154, turn]
type = turn
trigger1 = !time

[State 1154, poweradd]
type = poweradd
trigger1 = animtime = 0
value = 220
persistent = 0

[State 1154, end]
type = changestate
trigger1 = animtime = 0
value = 0
ctrl = 1

[Statedef 1155]
type = A
movetype = H
physics = N
velset = 5, 0

[State 1155, Screenbound]
type = screenbound
trigger1 = 1
movecamera = 1,0

[State 1155, snap]
type = posadd
trigger1 = time = 14
y = -64

[State 1155, Anim]
type = changeanim2
trigger1 = time = 14
value = 1003

[State 1155, move]
type = velset
trigger1 = time = 14
x=10
y=-15

[State 1155, air friction]
type = veladd
trigger1 = time >= 14
x = ifelse(vel X > 0,-.05,0)
y = .815

[State 1155, angle change]
type = angleset
trigger1 = time >= 14
value = 90+(time-14)*45

[State 1155, draw]
type = angledraw
trigger1 = time >= 14

[State 1155, Damage]
type = Lifeadd
triggerall = time > 14
trigger1 = vel x > 0
trigger1 = frontedgedist <= 20
value = ceil(-153*(enemy,fvar(2)))

[State 1155, stop]
type = velset
trigger1 = time > 14
trigger1 = vel X > 0
trigger1 = frontedgedist <= 20
x = 0
y = 0

[State 1155, Envshake]
type = Envshake
trigger1 = time > 14
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 1155, Land]
type = SelfState
trigger1 = time > 14
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
value = 5100

;------------------------------------------------------------------------
;Counter Low
[Statedef 1151]
type = C
movetype = I
physics = C
facep2 = 1
ctrl = 0
anim = 1151
velset = 0,0

[State 1151, Snd]
type = PlaySnd
trigger1 = !time
value = 0,0

[State 1151, Effect]
type = palfx
trigger1 = anim = 1151
time = 1
add = 0,64,192
mul = 0,256,208

[State 1151, Hitoverride]
type = hitoverride
trigger1 = anim = 1151
attr = SC, NA, SA, HA
stateno = 1158

[State 1151, Off]
type = changeanim
trigger1 = animtime = 0
trigger1 = anim = 1151
value = 1154

[State 1151, End]
type = changestate
trigger1 = animtime = 0
trigger1 = anim = 1154
value = 0
ctrl = 1

[Statedef 1156]
type = A
movetype = H
physics = N
velset = 5, 0

[State 1156, snap]
type = posadd
trigger1 = time = 18
y = -64

[State 1156, Anim]
type = changeanim2
trigger1 = time = 18
value = 1003

[State 1156, move]
type = velset
trigger1 = time = 18
x=5
y=-15

[State 1156, air friction]
type = veladd
trigger1 = time >= 18
x = ifelse(vel X > 0,-.05,0)
y = .815

[State 1156, angle change]
type = angleset
trigger1 = time >= 18
value = 90+(time-18)*45

[State 1156, draw]
type = angledraw
trigger1 = time >= 18

[State 1156, Damage]
type = Lifeadd
trigger1 = time = 18
value = ceil(-83*(enemy,fvar(2)))

[State 1157, poweradd]
type = poweradd
trigger1 = time = 18
value = 110
persistent = 0

[State 1156, Damage]
type = Lifeadd
triggerall = time > 18
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
value = ceil(-70*(enemy,fvar(2))*.75)

[State 1156, Envshake]
type = Envshake
trigger1 = time > 18
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 1156, Land]
type = SelfState
trigger1 = time > 18
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
value = 5100

;------------------------------------------------------------------------
;Counter Air
[Statedef 1152]
type = S
movetype = I
physics = S
facep2 = 1
ctrl = 0
anim = 1152
velset = 0,0

[State 1152, Snd]
type = PlaySnd
trigger1 = !time
value = 0,0

[State 1152, Effect]
type = palfx
trigger1 = anim = 1152
time = 1
add = 0,64,192
mul = 0,256,208

[State 1152, Kill those hoes]
type = reversaldef
trigger1 = 1
reversal.attr = A, NA, SA, HA
attr = S,ST
hitflag = A
guardflag = 
guard.dist = -1
priority = 7, hit
sparkno = -1
sparkxy = -10,-85
hitsound = S800,0
fall = 1
fall.recover = 0
yaccel = .68
getpower = 0,0
givepower = 0,0
p1stateno = 1154
p2stateno = 1157
p2facing = 1

[State 1152, Off]
type = changeanim
trigger1 = animtime = 0
trigger1 = anim = 1152
value = 1155

[State 1152, End]
type = changestate
trigger1 = animtime = 0
trigger1 = anim = 1155
value = 0
ctrl = 1

[Statedef 1157]
type = A
movetype = H
physics = N
velset = 5, 0

[State 1157, Screenbound]
type = screenbound
trigger1 = 1
movecamera = 1,0

[State 1157, snap]
type = posadd
trigger1 = time = 14
y = -64

[State 1157, Anim]
type = changeanim2
trigger1 = time = 14
value = 1003

[State 1157, move]
type = velset
trigger1 = time = 14
x=5
y=10

[State 1157, air friction]
type = veladd
trigger1 = time >= 14
x = ifelse(vel X > 0,-.05,0)
y = .815

[State 1157, angle change]
type = angleset
trigger1 = time >= 14
value = 90+(time-18)*45

[State 1157, draw]
type = angledraw
trigger1 = time >= 14

[State 1157, poweradd]
type = poweradd
triggerall = time > 14
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
value = 110
persistent = 0

[State 1157, Damage]
type = Lifeadd
triggerall = time > 14
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
value = ceil(-153*(enemy,fvar(2)))

[State 1157, Envshake]
type = Envshake
trigger1 = time > 14
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 1157, Land]
type = SelfState
trigger1 = time > 14
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
value = 5100

;Counter!
[Statedef 1158]
movetype = A

[State 1153, Don't counter I lied]
type = changestate
trigger1 = gethitvar(type) = 1
trigger2 = gethitvar(groundtype) = 1
trigger3 = gethitvar(type) = 1
trigger4 = gethitvar(groundtype) = 1
trigger5 = time = 1
value = 5000

[State 1158, Invince]
type = nothitby
trigger1 = 1
value = SCA, AA, AP, AT

[State 1158, Kill those hoes]
type = hitdef
trigger1 = 1
attr = S,ST
hitflag = M
guardflag = 
guard.dist = -1
priority = 7, hit
sparkno = -1
sparkxy = -10,-85
hitsound = S800,1
fall = 1
fall.recover = 0
yaccel = .68
getpower = 0,0
givepower = 0,0
p1stateno = 1154
p2stateno = 1156
p2facing = 1