;Super Throw!
[Statedef 3000]
type = S
movetype = A
physics = S
velset = 0,0
anim = 3000
ctrl = 0

[State 3000, Power Drain]
type = poweradd
trigger1 = !time
value = -1000

[State 3000, PalFX]
type = palfx
trigger1 = !time
time = 76
add = 128,0,0
mul = 256,256, 128
sinadd = 64,64,0,16

[State 3000, Nothitby]
type = nothitby
trigger1 = !time
time = 33
value = , AA, AP

[State 3000, Throw]
type = hitdef
triggerall = p2bodydist X <= 48
trigger1 = enemynear, stateno != [150,152]
trigger1 = enemynear, stateno != 40
attr = S,HT
hitflag = M
guardflag = 
guard.dist = -1
priority = 1, miss
sparkno = -1
hitsound = S800,2
fall = 1
fall.recover = 0
yaccel = .68
getpower = 0,0
givepower = 0,0
p1stateno = 3001
p2stateno = 3002

[State 3000, Voice]
type = playsnd
trigger1 = time = 2
value = 3000,1
channel = 0
volume = 255

[State 3000, SuperPause]
type = Superpause
trigger1 = time = 2
time = 31
movetime = 30
anim = -1
sound = S3000,0
p2defmul = 1
darken = 0
unhittable = 1

[State 3000, SuperBG]
type = helper
trigger1 = time = 3
stateno = 9000
name = "Super BG Helper"
ID = 9000
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 3000, Miss]
type = Statetypeset
trigger1 = animelemtime(3) = 0
movetype = I

[State 3000, Miss]
type = Changestate
trigger1 = animtime = 0
value = 0
ctrl = 1

[Statedef 3001]
anim = 3001

[State 3001, Bind]
type = targetbind
trigger1 = !time
pos = 55, 0

[State 3001, PalFX]
type = palfx
trigger1 = !time
time = 146
add = 128,0,0
mul = 256,256, 128
sinadd = 64,64,0,16

[State 3001, Voice]
type = playsnd
trigger1 = time = 20
value = 3000,2
channel = 0
volume = 255

[State 3001, Whoosh]
type = playsnd
triggerall = anim = 3001
trigger1 = animelemtime(3) = 0
trigger2 = animelemtime(8) = 0
trigger3 = animelemtime(13) = 0
trigger4 = animelemtime(17) = 0
trigger5 = animelemtime(21) = 0
trigger6 = animelemtime(25) = 0
value = 1,0

[State 3001, Width]
type = width
trigger1 = !time
edge = 55,61

[State 3001, Anim]
type = changeanim
trigger1 = animtime = 0
trigger1 = anim = 3001
value = 3002

[State 3001, End]
type = changestate
trigger1 = animtime = 0
trigger1 = anim = 3002
value = 0
ctrl = 1

[Statedef 3002]
type = A
movetype = H
physics = N
sprpriority = 1
velset = 0,0
facep2 = 1

[State 3002, Screenbound]
type = screenbound
trigger1 = 1
movecamera = 1,0

[State 3002, Anim]
type = changeanim2
trigger1 = !time
value = 806

[State 3002, Afterimages]
type = AfterImage
trigger1 = time = 0
time = 145
length = 10
timegap = 1
framegap = 2
paladd = 0,0,0
palmul = 1,1,1
palbright = 0,0,0
palcontrast = 200,200,200
trans = addalpha
alpha = 150,255

[State 3002, turn]
type = turn
trigger1 = time = 0
trigger1 = facing != enemy,facing
trigger2 = time = 20
trigger3 = time = 29
trigger4 = time = 37
trigger5 = time = 44
trigger6 = time = 50
trigger7 = time = 56
trigger8 = time = 62
trigger9 = time = 68
trigger10 = time = 74
trigger11 = time = 80
trigger12 = time = 86

[State 3002, Sprpriority]
type = sprpriority
trigger1 = time = 0
trigger2 = time = 29
trigger3 = time = 44
trigger4 = time = 56
trigger5 = time = 68
trigger6 = time = 80
value = 1

[State 3002, Sprpriority]
type = sprpriority
trigger1 = time = 20
trigger2 = time = 37
trigger3 = time = 50
trigger4 = time = 62
trigger5 = time = 74
trigger6 = time = 86
value = 3

[State 3002, move]
type = velset
trigger1 = time = 5
x=-7

[State 3002, move]
type = velset
trigger1 = time = 20
x=-10

[State 3002, move]
type = velset
trigger1 = time = 29
trigger2 = time = 86
x=-12.5

[State 3002, move]
type = velset
trigger1 = time = 37
trigger2 = time = 44
x=-15

[State 3002, move]
type = velset
trigger1 = time = 50
trigger2 = time = 56
trigger3 = time = 62
trigger4 = time = 68
trigger5 = time = 74
trigger6 = time = 80
x=-17.5

[State 3002, snap]
type = posadd
trigger1 = time = 92
y = -64

[State 3002, Anim]
type = changeanim2
trigger1 = time = 92
value = 1003

[State 3002, move]
type = velset
trigger1 = time = 92
x=-2
y=-19.2

[State 3002, poweradd]
type = poweradd
trigger1 = time = 92
value = 120
persistent = 0

[State 3002, regular friction]
type = veladd
trigger1 = time <= 92
trigger1 = vel x < 0
x = .05

[State 3002, air friction]
type = veladd
trigger1 = time > 92
y = .815

[State 3002, angle change]
type = angleset
trigger1 = time > 92
value = 90+(time-92)*45

[State 3002, draw]
type = angledraw
trigger1 = time > 92

[State 3002, Damage]
type = Lifeadd
trigger1 = time = 93
value = ceil(-167*(enemy,fvar(2))*(ifelse(gethitvar(hitcount)>=4,.25,ifelse(gethitvar(hitcount)=3,.5,ifelse(gethitvar(hitcount)=2,.75,1)))))

[State 3002, poweradd]
type = poweradd
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
value = 50
persistent = 0

[State 3002, Damage]
type = Lifeadd
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
value = ceil(-69*(enemy,fvar(5)))

[State 3002, Envshake]
type = Envshake
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 3002, Land]
type = SelfState
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
value = 5100

;------------------------------------------------------------------------
;Super Counter
[Statedef 3050]
type = S
movetype = I
physics = S
facep2 = 1
ctrl = 0
anim = 3050
velset = 0,0

[State 3050, Power Drain]
type = poweradd
trigger1 = !time
value = -1000

[State 3050, Snd]
type = PlaySnd
trigger1 = !time
value = 0,0

[State 3050, Effect]
type = palfx
trigger1 = anim = 3050
time = 1
add = 0,64,192
mul = 0,256,208

[State 3050, Nothitby]
type = nothitby
trigger1 = anim = 3050
value = , AT

[State 3050, Kill those hoes]
type = reversaldef
trigger1 = 1
reversal.attr = SCA, NA, SA, HA
attr = S,ST
hitflag = MAFD
guardflag = 
guard.dist = -1
priority = 7, hit
sparkno = -1
hitsound = -1
fall = 1
fall.recover = 0
yaccel = .68
getpower = 0,0
givepower = 0,0
p1stateno = 3051
p2stateno = 3052
p2facing = 1

[State 3050, Off]
type = changeanim
trigger1 = animtime = 0
trigger1 = anim = 3050
value = 3051

[State 3050, End]
type = changestate
trigger1 = animtime = 0
trigger1 = anim = 3051
value = 0
ctrl = 1

[Statedef 3051]
type = S
movetype = A
physics = N
velset = 0, 0
anim = 3052

[State 3051, TargetBind]
type = targetbind
trigger1 = time = 0
pos = 55, (target,pos Y)

[State 3051, PalFX]
type = palfx
trigger1 = time = 0
time = 209
add = 128,0,0
mul = 256,256, 128
sinadd = 64,64,0,16

[State 3051, SuperPause]
type = Superpause
trigger1 = time = 1
time = 29
movetime = 29
anim = -1
sound = S3000,0
p2defmul = 1
darken = 0
unhittable = 1

[State 3051, SuperBG]
type = helper
trigger1 = time = 2
stateno = 9000
name = "Super BG Helper"
ID = 9000
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999
persistent = 0

[State 3051, Voice]
type = playsnd
trigger1 = time = 1+29
value = 3050,0
channel = 0
volume = 255

[State 3051, Turn]
type = turn
trigger1 = time = 1+29
trigger2 = time = 36+29
trigger3 = time = 64+29
trigger4 = time = 92+29
trigger5 = time = 120+29

[State 3051, Changeanim]
type = changeanim
trigger1 = time = 36+29
value = 3053

[State 3051, Changeanim]
type = changeanim
trigger1 = time = 120+29
value = 3054

[State 3051, Sound]
type = playsnd
triggerall = time < 120+29
trigger1 = target, Vel Y > 0
trigger1 = target, Pos Y >= 0
value = 10,2

[State 3051, Sound]
type = playsnd
trigger1 = anim = 3052
trigger1 = animelemtime(4) = 0
trigger2 = anim = [3053,3054]
trigger2 = animelemtime(2) = 0
value = 1,0

[State 3051, End]
type = changestate
trigger1 = animtime = 0
trigger1 = anim = 3054
value = 0
ctrl = 1

;OUCH
[Statedef 3052]
movetype = H
physics = N
statetype = A
velset = 1.5,0

[State 3052, Screenbound]
type = screenbound
trigger1 = 1
movecamera = 1,0

[State 3052, turn]
type = turn
trigger1 = time = 16
trigger2 = time = 34
trigger3 = time = 62
trigger4 = time = 90
trigger5 = time = 118

[State 3052, snap]
type = posset
trigger1 = time = 16
trigger2 = time = 118
y = -64

[State 3052, Anim]
type = changeanim2
trigger1 = time = 16
value = 1003

[State 3052, drop1]
type = velset
trigger1 = time = 16
x=-5.5
y=5

[State 3052, first friction]
type = veladd
trigger1 = time = [16,34)
trigger1 = pos Y < 0
x = .05
y = .815

[State 3052, rise]
type = velset
trigger1 = time = 34
trigger2 = time = 62
trigger3 = time = 90
x=-1
y=-8.18

[State 3052, rise accel]
type = veladd
trigger1 = time = [35,43]
trigger2 = time = [63,71]
trigger3 = time = [91,99]
x=-1
y=-.68

[State 3052, fall]
type = velset
trigger1 = time = 44
trigger2 = time = 72
trigger3 = time = 100
x=-6
y=7.5

[State 3052, fall friction]
type = veladd
triggerall = pos Y < 0
trigger1 = time = [44,62)
trigger2 = time = [72,90)
trigger3 = time = [100,118)
x = .05
y = .815

[State 3052, final rise]
type = velset
trigger1 = time = [118,127]
y=-2.5

[State 3052, accel]
type = veladd
trigger1 = time = (0,16)
x = .5

[State 3052, accel]
type = veladd
trigger1 = time = [118,127]
x = -.5

[State 3052, launch]
type = velset
trigger1 = time = 128
x=-7.5
y=-15

[State 3052, Stop]
type = velset
trigger1 = backedgebodydist <= 0
trigger1 = vel x < 0
x = 0

[State 3052, Stop]
type = velset
trigger1 = frontedgebodydist <= 0
trigger1 = vel x > 0
x = 0

[State 3052, air friction]
type = veladd
trigger1 = time >= 128
y = .8

[State 3052, air friction]
type = veladd
trigger1 = time >= 128
trigger1 = vel x < 0
x = .005

[State 3052, angle change]
type = angleset
trigger1 = time >= 16
trigger1 = vel Y <= 0
value = 90

[State 3052, angle change]
type = angleset
trigger1 = time >= 16
trigger1 = pos Y < 0
trigger1 = vel Y > 0
value = 90+(time-16)*45

[State 3052, draw]
type = angledraw
trigger1 = time >= 16

[State 3052, poweradd]
type = poweradd
triggerall = time < 118
trigger1 = Vel Y > 0
trigger1 = Pos Y >= 0
value = 20

[State 3052, Damage]
type = Lifeadd
triggerall = time < 118
trigger1 = Vel Y > 0
trigger1 = Pos Y >= 0
value = ceil(-28*(enemy,fvar(2)))

[State 3052, Envshake]
type = Envshake
triggerall = time < 118
trigger1 = Vel Y > 0
trigger1 = Pos Y >= 0
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 3052, correction]
type = velset
trigger1 = vel y > 0
trigger1 = pos Y >= 0
x = 0
y = 0

[State 3052, correction]
type = posset
trigger1 = pos Y > 0
y = 0

[State 3052, poweradd]
type = poweradd
triggerall = time > 118
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
value = 50

[State 3052, Damage]
type = Lifeadd
triggerall = time > 118
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
value = ceil(-57*(enemy,fvar(2)))

[State 3052, Envshake]
type = Envshake
triggerall = time > 118
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 3052, Land]
type = SelfState
trigger1 = time > 118
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
value = 5100

;Super Anti-Air
[Statedef 3100]
type = S
movetype = A
physics = S
velset = 0,0
anim = 3100
ctrl = 0

[State 3100, Power Drain]
type = poweradd
trigger1 = !time
value = -1000

[State 3100, PalFX]
type = palfx
trigger1 = !time
time = 79
add = 128,0,0
mul = 256,256, 128
sinadd = 64,64,0,16

[State 3100, Nothitby]
type = nothitby
trigger1 = !time
time = 33
value = , AA, AP

[State 3100, Throw]
type = hitdef
trigger1 = !time
attr = A,HT
hitflag = AF
guardflag = 
guard.dist = -1
priority = 1, miss
sparkno = -1
hitsound = S800,2
fall = 1
fall.recover = 0
yaccel = .68
getpower = 0,0
givepower = 0,0
p1stateno = 3101
p2stateno = 3102
p2facing = 1

[State 3100, Jump]
type = changeanim
trigger1 = time = 34
value = 3101

[State 3100, Jump]
type = velset
trigger1 = time = 34
x = 7.5
y = -10

[State 3100, Voice]
type = playsnd
trigger1 = time = 2
value = 3100,0
channel = 0

[State 3100, SuperPause]
type = Superpause
trigger1 = time = 1
time = 31
movetime = 30
anim = -1
sound = S3000,0
p2defmul = 1
darken = 0
unhittable = 1

[State 3100, SuperBG]
type = helper
trigger1 = time = 1
stateno = 9000
name = "Super BG Helper"
ID = 9000
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 3100, Miss]
type = Statetypeset
trigger1 = anim = 3101
trigger1 = animelemtime(4) = 0
movetype = I

[State 3100, Physics]
type = Statetypeset
trigger1 = pos y < 0
statetype = A
physics = N

[State 3100, Physics]
type = Statetypeset
trigger1 = pos y >= 0
statetype = S
physics = S

[state 3100, Physics]
type = veladd
trigger1 = statetype = A
y = .68

[state 3100, Physics]
type = veladd
trigger1 = statetype = A
trigger1 = anim = 3101
x = -.05

[state 3100, Physics]
type = velset
trigger1 = vel y > 0
trigger1 = pos y >= 0
x = 0
y = 0

[state 3100, Physics]
type = posset
trigger1 = pos y >= 0
y = 0

[State 3100, Miss]
type = Changeanim
trigger1 = anim = 3101
trigger1 = pos y = 0
trigger1 = vel y = 0
value = 3102

[State 3100, Miss]
type = Changestate
trigger1 = anim = 3102
trigger1 = animtime = 0
value = 0
ctrl = 1

[Statedef 3101]
type = A
movetype = A
physics = N
velset = 5
anim = 3103
ctrl = 0

[State 3101, Targetbind]
type = targetbind
trigger1 = anim = 3103
pos = 0,-25

[State 3101, Targetbind]
type = targetbind
trigger1 = anim = 3104
pos = 0,0

[State 3101, Physics]
type = Statetypeset
trigger1 = pos y >= 0
statetype = S
physics = N

[State 3101, Slide]
type = velset
trigger1 = anim = 3103
trigger1 = statetype = S
x = 7.5

[State 3100, Voice]
type = playsnd
trigger1 = anim = 3103
trigger1 = statetype = S
value = 3100,1
channel = 0
persistent = 0

[State 3101, Land]
type = changeanim
trigger1 = anim = 3103
trigger1 = statetype = S
trigger1 = e||(var(4):= 0)
value = 3104

[State 3101, Damage]
type = TargetLifeadd
trigger1 = anim = 3104
trigger1 = var(4):=var(4)+1
value = ceil(-19*fvar(2)*(ifelse(target,gethitvar(hitcount)>=4,.25,ifelse(target,gethitvar(hitcount)=3,.5,ifelse(target,gethitvar(hitcount)=2,.75,1)))))
persistent = 4

[State 3101, hitspark]
type = helper
trigger1 = anim = 3104
name = "Ground Spark"
ID = 10015
pos = 0,0
stateno = 10015
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 4

[State 3052, Envshake]
type = Envshake
trigger1 = anim = 3104
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 4

[State 3101, Sound]
type = playsnd
trigger1 = anim = 3104
value = 10,1
persistent = 4

[State 3101, Rocks]
type = helper
trigger1 = anim = 3104
name = "Rock Helper"
ID = 10016
pos = 0,0
stateno = 10016
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 12

[State 3101, Unbind]
type = targetdrop
trigger1 = anim = 3104
trigger1 = var(4) = 10

[State 3101, Jump Out]
type = changeanim
trigger1 = anim = 3104
trigger1 = var(4) = 10
value = 3105

[State 3101, Jump Out]
type = changeanim
trigger1 = anim = 3105
trigger1 = animtime = 0
value = 3106

[State 3101, Jump Out]
type = velset
trigger1 = anim = 3106
x = -1.4
y = -6.14
persistent = 0

[State 3101, Push]
type = posadd
trigger1 = enemy, backedgebodydist < 5
x = enemy, vel x

[state 3101, Physics]
type = veladd
trigger1 = anim != 3106
trigger1 = statetype = A
y = .68

[state 3101, Physics]
type = veladd
trigger1 = anim = 3104
x = -.06

[state 3101, Physics]
type = veladd
trigger1 = anim = 3106
x = .05

[State 3101, Physics]
type = Statetypeset
trigger1 = anim = 3106
statetype = A
physics = A

[state 3101, Physics]
type = velset
trigger1 = vel y > 0
trigger1 = pos y >= 0
y = 0

[state 3101, Physics]
type = posset
trigger1 = pos y >= 0
y = 0


[Statedef 3102]
type = A
physics = N
ctrl = 0
movetype = H

[State 3102, Screenbound]
type = screenbound
trigger1 = 1
movecamera = 1,0

[state 3102, Anim]
type = changeanim2
trigger1 = !time
value = 3107

[State 3102, Unbound]
type = changestate
trigger1 = !gethitvar(isbound)
value = 3103

[Statedef 3103]
type = S
physics = N
velset = -5.1
movetype = H

[state 3103, Physics]
type = veladd
trigger1 = 1
x = .06

[State 3103, End]
type = selfstate
trigger1 = time = 30
trigger1 = alive
value = 5120

[State 3103, End]
type = selfstate
trigger1 = time = 30
trigger1 = !alive
value = 5150

;===========================================================================
;Level 3, Part 2
[Statedef 3150]
type = S
movetype = A
physics = S
velset = 0,0
anim = 3100
ctrl = 0

[State 3150, Power Drain]
type = poweradd
trigger1 = !time
value = -1000

[State 3150, PalFX]
type = palfx
trigger1 = !time
time = 79
add = 128,0,0
mul = 256,256, 128
sinadd = 64,64,0,16

[State 3150, Nothitby]
type = nothitby
trigger1 = !time
time = 33
value = , AA, AP

[State 3150, Throw]
type = hitdef
trigger1 = !time
attr = A,HT
hitflag = AF
guardflag = 
guard.dist = -1
priority = 1, miss
sparkno = -1
hitsound = S800,2
ground.velocity = 0,0
fall = 1
fall.recover = 0
fall.yvelocity = -8.16
down.bounce = 1
yaccel = .68
getpower = 0,0
givepower = 0,0
p1stateno = 3151
p2stateno = 3152
p2facing = 1

[State 3150, Jump]
type = changeanim
trigger1 = time = 34
value = 3150

[State 3150, Jump]
type = velset
trigger1 = time = 34
x = 7.5
y = -14

[State 3150, Voice]
type = playsnd
trigger1 = time = 2
value = 3100,0
channel = 0

[State 3100, SuperPause]
type = Superpause
trigger1 = time = 1
time = 31
movetime = 30
anim = -1
sound = S3000,0
p2defmul = 1
darken = 0
unhittable = 1

[State 3100, SuperBG]
type = helper
trigger1 = time = 1
stateno = 9000
name = "Super BG Helper"
ID = 9000
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 3100, Miss]
type = Statetypeset
trigger1 = anim = 3101
trigger1 = animelemtime(4) = 0
movetype = I

[State 3100, Physics]
type = Statetypeset
trigger1 = pos y < 0
statetype = A
physics = N

[State 3100, Physics]
type = Statetypeset
trigger1 = pos y >= 0
statetype = S
physics = S

[state 3100, Physics]
type = veladd
trigger1 = statetype = A
y = .68

[state 3100, Physics]
type = veladd
trigger1 = statetype = A
trigger1 = anim = 3101
x = -.05

[state 3100, Physics]
type = velset
trigger1 = vel y > 0
trigger1 = pos y >= 0
x = 0
y = 0

[state 3100, Physics]
type = posset
trigger1 = pos y >= 0
y = 0

[State 3100, Miss]
type = Changeanim
trigger1 = anim = 3150
trigger1 = pos y = 0
trigger1 = vel y = 0
value = 3102

[State 3100, Miss]
type = Changestate
trigger1 = anim = 3102
trigger1 = animtime = 0
value = 0
ctrl = 1


;Super connected!
[Statedef 3151]
type = A
movetype = A
physics = N
anim = 3151
velset = 5

[State 3151, Physics]
type = veladd
trigger1 = pos Y < 0
y = .68

[State 3151, Whoosh]
type = playsnd
trigger1 = anim = 3151
value = 1,0
persistent = 8

[State 3151, Bind]
type = targetbind
trigger1 = anim = 3151
pos = -1,-64

[State 3151, Land]
type = posset
trigger1 = anim = 3151
trigger1 = pos y + vel y >= 0
y = 0

[State 3151, Land]
type = velset
trigger1 = pos y = 0
x = 5
y = 0
persistent = 0

[State 3151, Land]
type = changeanim
trigger1 = pos y = 0
trigger1 = anim = 3151
value = 3152

[State 3151, Type]
type = statetypeset
trigger1 = anim = 3152
statetype = S
persistent = 0

[State 3151, Damage]
type = targetlifeadd
trigger1 = anim = 3152
value = ceil(-194*fvar(2)*(ifelse(target,gethitvar(hitcount)>=4,.25,ifelse(target,gethitvar(hitcount)=3,.5,ifelse(target,gethitvar(hitcount)=2,.75,1)))))
persistent = 0

[State 3151, Envshake]
type = Envshake
trigger1 = anim = 3152
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 3151, hitspark]
type = helper
trigger1 = anim = 3152
name = "Ground Spark"
ID = 10015
pos = 0,0
stateno = 10015
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 3151, Sound]
type = playsnd
trigger1 = anim = 3152
value = 10,1
persistent = 0

[State 3101, Rocks]
type = helper
trigger1 = anim = 3152
name = "Rock Helper"
ID = 10018
pos = 0,0
stateno = 10016
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 3151, Physics]
type = veladd
trigger1 = anim = 3152
x = -.005

[State 3151, End]
type = changestate
trigger1 = animtime = 0
trigger1 = anim = 3152
value = 11
ctrl = 1



[Statedef 3152]
type = A
movetype = H
physics = N
ctrl = 0

[State 3152, Anim]
type = changeanim2
trigger1 = !time
value = 1003

[State 3152, Rotate]
type = angleadd
trigger1 = !time
value = -90

[State 3152, Rotate]
type = angleadd
trigger1 = time%2 = 0
trigger1 = time
value = 90

[State 3152, Rotate]
type = angledraw
trigger1 = time

[State 3152, Physics]
type = velset
trigger1 = gethitvar(isbound)
trigger1 = enemy, Vel Y > 0
y = enemy, vel Y

[State 3152, Physics]
type = veladd
trigger1 = !gethitvar(isbound)
y = .68

[State 3152, Hit the ground]
type = velset
trigger1 = pos y + vel y >= 0
trigget1 = !gethitvar(isbound)
x = 0

[State 3152, Hit the ground]
type = selfstate
trigger1 = pos y + vel y >= 0
trigget1 = !gethitvar(isbound)
value = 5100


;Finish!
[Statedef 3200]
movetype = A
physics = N
ctrl = 0
anim = 3200
velset = 0,0

[State 3000, Voice]
type = playsnd
trigger1 = time = 1
value = 3200,0
channel = 0

[State 3000, SuperBG]
type = helper
trigger1 = time = 1
stateno = 9002
name = "Hyper BG Helper"
ID = 9000
ownpal = 1
facing = 1
pausemovetime = 999999
supermovetime = 999999

[State 3200, SuperPause]
type = Superpause
trigger1 = time = 1
time = 50
movetime = 50
anim = -1
sound = S3000,0
p2defmul = 1
darken = 0
unhittable = 1

[State 3200, Power Drain]
type = poweradd
trigger1 = !time
value = -1000

[State 3200, PalFX]
type = palfx
trigger1 = !time
time = 140
add = 128,0,0
mul = 256,256, 128
sinadd = 64,64,0,16

[State 3151, Type]
type = statetypeset
trigger1 = pos y >= 0
statetype = S

[State 3151, Type]
type = statetypeset
trigger1 = pos y < 0
statetype = A

[State 3200, Flip]
type = turn
trigger1 = !time

[State 3200, Voice]
type = playsnd
trigger1 = movehit
value = 3200,1
channel = 0
volume = 255
persistent = 0

[State 3200, state]
type = targetstate
triggerall = numtarget
trigger1 = !time
trigger2 = movehit = 10
value = 3201
ignorehitpause = 1

[State 3200, Jump]
type = velset
trigger1 = anim = 3200
trigger1 = animelemtime(2) = 0
x = -1
y = -10

[State 3200, Land]
type = changeanim
trigger1 = pos y + vel y > 0
trigger1 = anim = 3200
value = 3201

[State 3200, Hitdef]
type = Hitdef
trigger1 = anim = 3200
attr = S,HT
hitflag = FD
guardflag = 
animtype = medium
damage = ceil(347*fvar(5)),0
pausetime = 10,10
sparkno = -1
guard.sparkno = -1
sparkxy = 0,0
hitsound = S10,3
ground.slidetime = 10
ground.hittime = 40
yaccel = .68
fall = 1
fall.recover = 40
getpower = 0,0
givepower = 0,0

[State 3200, Envshake]
type = Envshake
trigger1 = movecontact
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 3200, hitspark]
type = helper
trigger1 = movehit
name = "Ground Spark"
ID = 10015
pos = 0,0
stateno = 10015
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 3200, Rocks]
type = helper
trigger1 = movehit
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
trigger1 = movehit
name = "Dust Helper"
ID = 10018
pos = 0,0
stateno = 10018
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 3200, Physics]
type = veladd
trigger1 = anim != 3201
trigger1 = pos Y < 0
y = .68

[State 3200, Jump Out]
type = changeanim
trigger1 = anim = 3201
trigger1 = animtime = 0
value = 3202

[State 3200, Jump Out]
type = velset
trigger1 = anim = 3202
trigger1 = animelemtime(2) = 0
x = -2.5
y = -10
persistent = 0

[State 3200, Land]
type = posset
trigger1 = anim != 3201
trigger1 = pos y + vel y >= 0
y = 0

[State 3200, Land]
type = velset
trigger1 = pos y + vel y > 0
x = 0
y = 0

[State 3200, End]
type = Changeanim
trigger1 = anim = 3202
trigger1 = pos y = 0
trigger1 = vel y = 0
value = 3102

[State 3200, End]
type = Changestate
trigger1 = anim = 3102
trigger1 = animtime = 0
value = 0
ctrl = 1



[Statedef 3201]
type = L
movetype = H
physics = S
ctrl = 0
velset = 0,0

[State 3201, Width]
type = width
trigger1 = time = 1
edge = 30,30

[State 3201, Pos]
type = posset
trigger1 = !time
y = 0

[State 3201, Anim]
type = changeanim2
trigger1 = !time
value = 3203

[State 3201, Push]
type = velset
trigger1 = enemy, backedgebodydist <= 1
x = -1* enemy, vel X

[State 3201, Recover]
type = selfstate
trigger1 = time = 50
trigger1 = alive
trigger1 = enemy, anim != [3200,3201]
value = 5120

[State 3201, Recover]
type = selfstate
trigger1 = time = 50
trigger1 = !alive
trigger1 = enemy, anim != [3200,3201]
value = 5150