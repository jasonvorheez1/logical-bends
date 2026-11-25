;Variables
; var(0) - AI
; var(1) - AI

; var(2) - cancels
; var(3) - Counterhit timer
; fvar(1) - juggle velocity helper
; fvar(2) - guts
; fvar(3) - combo modifier
; fvar(4) - counterhit system
; fvar(5) - Total Damage Modifier

; var(56)
; var(57) AI Variables (WinmugenPlus)
; var(58)

;---------------------------------------------------------------------------
; Lose by Time Over
[Statedef 170]
type = S
ctrl = 0
anim = 170
velset = 0,0

[State 170, 1]
type = NotHitBy
trigger1 = 1
value = SCA
time = 1

;---------------------------------------------------------------------------
; Win state decider
[Statedef 180]
type = S

[State 180, 1]
type = ChangeState
trigger1 = matchover
value = 182

[State 180, 2]
type = Changestate
trigger1 = 1
value = 181

;---------------------------------------------------------------------------
; Win pose 1 Arms Crossed
[Statedef 181]
type = S
ctrl = 0
anim = 180
velset = 0,0

[State 181, Talk]
type = playsnd
trigger1 = !time
value = 180,random%2
persistent = 0

[State 181, RoundNotOver]
type = assertspecial
trigger1 = animelemtime(16) < 120
flag = roundnotover

[State 181, 1]
type = NotHitBy
trigger1 = 1
value = SCA
time = 1

;---------------------------------------------------------------------------
; Win pose 2 Hats-off
[Statedef 182]
type = S
ctrl = 0
anim = 181
velset = 0,0

[State 182, Talk]
type = playsnd
trigger1 = !time
value = 180,random%2+2
persistent = 0

[State 182, RoundNotOver]
type = assertspecial
trigger1 = animelemtime(9) < 120
flag = roundnotover

[State 182, 1]
type = NotHitBy
trigger1 = 1
value = SCA
time = 1

;---------------------------------------------------------------------------
; Introduction
[Statedef 191]
type = S
ctrl = 0
anim = 190
velset = 0,0

[State 191, Talk]
type = playsnd
trigger1 = animelemtime(2) = 0
value = 190, 0
persistent = 0

[State 191, 1] ;Freeze animation until PreIntro is over
type = ChangeAnim
trigger1 = RoundState = 0
value = 190

[State 191, 2] ;Assert this until you want "round 1, fight" to begin
type = AssertSpecial
trigger1 = 1
flag = Intro

[State 191, 3] ;Change to stand state when done
type = ChangeState
trigger1 = AnimTime = 0
value = 0

;---------------------------------------------------------------------------
;Standing A
[Statedef 200]
type = S
physics = S
anim = 200
ctrl = 0
sprpriority = 2
facep2 = 1
movetype = A

[State 200, Cancel]
type = varset
trigger1 = !time
v = 2
value = 0

[State 200, Voice]
type = PlaySnd
trigger1 = !time
value = 0,0
channel = 0

[State 200, Whoosh]
type = PlaySnd
trigger1 = animelemtime(2) = 0
value = 1,0

[State 200, Vel Adjust]
type = varset
triggerall = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) = 0
trigger2 = p2movetype != H
fv = 1
value = -.68

[State 200, Vel Adjust]
type = varset
trigger1 = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) >= 1
fv = 1
value = -.9 + .72*(enemy,gethitvar(hitcount)-1) -.68

[State 200, Hitdef]
type = Hitdef
trigger1 = !time
attr = S,NA
hitflag = MAF
guardflag = MA
animtype = light
priority = 3, hit
damage = ceil(31*fvar(5)),0
pausetime = 9,9
guard.pausetime = 9, 8
sparkno = -1
guard.sparkno = -1
sparkxy = -10,-85
hitsound = S10,ifelse(fvar(4)>1,3,0)
guardsound = S800,2
ground.type = high
ground.slidetime = 7
ground.hittime = 12
air.hittime = 12
air.velocity = -2-((p2statetype = A)&&(p2movetype = H)),-4.86+fvar(1)
yaccel = .68
ground.velocity = -5.3538083
guard.velocity =  -4.8570632
ground.cornerpush.veloff = -4.8570632*1.2
airguard.velocity = -3.2,-2
fall = (p2statetype = A) && (p2movetype = H)
fall.recovertime = 900
getpower = 40,20
givepower = 20,0

[State 200, Cornerpush Physics]
type = velset
trigger1 = numtarget
trigger1 = target, gethitvar(hittime) < 0
trigger1 = movetype = I
trigger1 = vel X < 0
x = 0

[State 200, hitspark]
type = helper
trigger1 = time
trigger1 = movecontact
name = "Spark"
ID = 10000
postype = p2
pos = target,const(size.ground.front)-10,-85-ceil(p2bodydist Y)
stateno = 10000 + (20*moveguarded)
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 200, Cancel]
type = varset
trigger1 = animelemtime(3) = -1
trigger1 = movecontact
v = 2
value = 1

[State 200, Idle]
type = statetypeset
trigger1 = animelemtime(3) = 0
movetype = I

[State 200, End]
type = changestate
trigger1 = animtime = 0
value = 0
ctrl = 1

;---------------------------------------------------------------------------
;Standing B
[Statedef 210]
type = S
physics = S
anim = 210
ctrl = 0
sprpriority = 2
facep2 = 1
movetype = A

[State 200, Cornerpush Physics]
type = velset
trigger1 = numtarget
trigger1 = target, gethitvar(hittime) < 0
trigger1 = movetype = I
trigger1 = vel X < 0
x = 0

[State 210, Voice]
type = PlaySnd
trigger1 = !time
value = 0,1
channel = 0

[State 210, Whoosh]
type = PlaySnd
trigger1 = animelemtime(2) = 0
value = 1,0

[State 210, Cancel]
type = varset
trigger1 = !time
v = 2
value = 0

[State 210, Vel Adjust]
type = varset
triggerall = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) = 0
trigger2 = p2movetype != H
fv = 1
value = 0

[State 210, Vel Adjust]
type = varset
trigger1 = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) >= 1
fv = 1
value = .72*(enemy, gethitvar(hitcount))

[State 210, Hitdef]
type = Hitdef
trigger1 = !time
attr = S,NA
hitflag = MAF
guardflag = MA
animtype = medium
priority = 4, hit
damage = ceil(63*fvar(5)),0
pausetime = 10,10
guard.pausetime = 9, 8
sparkno = -1
guard.sparkno = -1
sparkxy = -10,-85
hitsound = S10,ifelse(fvar(4)>1,3,1)
guardsound = S12,1
ground.type = high
ground.slidetime = 9
ground.hittime = 16
air.hittime = 16
air.velocity = -2-((p2statetype = A)&&(p2movetype = H)),-6.48+fvar(1)
yaccel = .68
ground.velocity = -7.5255434
guard.velocity =  -7.2327207
ground.cornerpush.veloff = -7.2327207*1.2
airguard.velocity = -2.5,-4
fall = (p2statetype = A) && (p2movetype = H)
fall.recovertime = 900
getpower = 70,20
givepower = 40,0

[State 210, hitspark]
type = helper
trigger1 = time
trigger1 = movecontact
name = "Spark"
ID = 10000
postype = p2
pos = target,const(size.ground.front)-15,-76-ceil(p2bodydist Y)
stateno = 10000 + (20*moveguarded)
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 210, Cancel]
type = varset
trigger1 = animelemtime(3) = -1
trigger1 = movecontact
v = 2
value = 1

[State 210, Poweradd]
type = poweradd
trigger1 = animelemtime(2) = 0
value = 20

[State 210, Idle]
type = statetypeset
trigger1 = animelemtime(3) = 0
movetype = I

[State 210, End]
type = changestate
trigger1 = animtime = 0
value = 0
ctrl = 1

;---------------------------------------------------------------------------
;Standing C
[Statedef 220]
type = S
physics = S
anim = 220
ctrl = 0
sprpriority = 2
facep2 = 1
movetype = A

[State 200, Cornerpush Physics]
type = velset
trigger1 = numtarget
trigger1 = target, gethitvar(hittime) < 0
trigger1 = movetype = I
trigger1 = vel X < 0
x = 0

[State 220, Voice]
type = PlaySnd
trigger1 = animelemtime(3) = 0
value = 0,2
channel = 0

[State 220, Whoosh]
type = PlaySnd
trigger1 = animelemtime(4) = 0
value = 1,0

[State 220, Cancel]
type = varset
trigger1 = !time
v = 2
value = 0

[State 220, Vel Adjust]
type = varset
triggerall = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) = 0
trigger2 = p2movetype != H
fv = 1
value = 0

[State 220, Vel Adjust]
type = varset
trigger1 = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) >= 1
fv = 1
value = .72*(enemy, gethitvar(hitcount))

[State 220, Push]
type = width
trigger1 = animelemtime(3) >= 0
trigger1 = animelemtime(7) < 0
value = 40, 0

[State 220, Hitdef]
type = Hitdef
trigger1 = !time
attr = S,NA
hitflag = MAF
guardflag = MA
animtype = back
priority = 5, hit
damage = ceil(101*fvar(5)),0
pausetime = 2,2
guard.pausetime = 2,2
sparkno = -1
guard.sparkno = -1
sparkxy = -10,-85
hitsound = S10,ifelse(fvar(4)>1,3,2)
guardsound = S12,0
ground.type = high
ground.slidetime = 14
ground.hittime = 16
air.hittime = 16
air.velocity = -3,-6.75+fvar(1)
yaccel = .68
ground.velocity = -3,-7.5
guard.velocity =  -9.2785539
ground.cornerpush.veloff = -9.2785539*1.2
airguard.velocity = -2.5,-6
fall = 1
fall.recovertime = 900
getpower = 110,40
givepower = 70,0

[State 220, Envshake]
type = Envshake
trigger1 = movecontact
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 220, hitspark]
type = helper
trigger1 = time
trigger1 = movecontact
name = "Spark"
ID = 10000
postype = p2
pos = target,const(size.ground.front)-20,-60-ceil(p2bodydist Y)
stateno = 10000 + (20*moveguarded)
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 220, Poweradd]
type = poweradd
trigger1 = animelemtime(4) = 0
value = 30

[State 220, Idle]
type = statetypeset
trigger1 = animelemtime(5) = 0
movetype = I

[State 220, End]
type = changestate
trigger1 = animtime = 0
value = 0
ctrl = 1

;---------------------------------------------------------------------------
;Forward C
[Statedef 230]
type = S
physics = S
anim = 230
ctrl = 0
sprpriority = 2
facep2 = 1
movetype = A

[State 200, Cornerpush Physics]
type = velset
trigger1 = numtarget
trigger1 = target, gethitvar(hittime) < 0
trigger1 = movetype = I
trigger1 = vel X < 0
x = 0

[State 230, Jump]
type = statetypeset
trigger1 = animelemtime(2) = 0
statetype = A
physics = N

[State 230, Voice]
type = PlaySnd
trigger1 = animelemtime(5) = 0
value = 0,1
channel = 0

[State 230, Whoosh]
type = PlaySnd
trigger1 = animelemtime(6) = 0
value = 1,0

[State 230, Move]
type = velset
trigger1 = animelemtime(2) = 0
x = 6

[State 230, Slowdown]
type = veladd
trigger1 = animelemtime(2) >= 0
trigger1 = animelemtime(5) < 0
x = -.005

[State 230, Stop]
type = velset
trigger1 = animelemtime(5) = 0
x = 0

[State 230, Stop]
type = statetypeset
trigger1 = animelemtime(5) = 0
statetype = S
physics = S

[State 230, Cancel]
type = varset
trigger1 = !time
v = 2
value = 0

[State 230, Vel Adjust]
type = varset
triggerall = !time
trigger1 = numtarget
trigger1 = enemy, gethitvar(hitcount) = 0
trigger2 = !numtarget
fv = 1
value = -.68

[State 230, Vel Adjust]
type = varset
trigger1 = !time
trigger1 = numtarget
trigger1 = target, gethitvar(hitcount) >= 1
fv = 1
value = 1.62 + .72*(target,gethitvar(hitcount)-1) -.68

[State 230, Hitdef]
type = Hitdef
trigger1 = !time
attr = S,NA
hitflag = MAF
guardflag = MA
animtype = hard
priority = 5, hit
damage = ceil(111*fvar(5)),0
pausetime = 11,11
guard.pausetime = 11,11
sparkno = -1
guard.sparkno = -1
sparkxy = -10,-85
hitsound = S10,ifelse(fvar(4)>1,3,2)
guardsound = S12,0
ground.type = high
ground.slidetime = 12
ground.hittime = 18
air.hittime = 18
air.velocity = -2-((p2statetype = A)&&(p2movetype = H)),(-8.1+fvar(1))
yaccel = .68
ground.velocity = -9.0934713
guard.velocity =  -9.7055319
ground.cornerpush.veloff = -9.7055319*1.2
airguard.velocity = -2.5,-6
fall = (p2statetype = A) && (p2movetype = H)
fall.recovertime = 900
getpower = 120,40
givepower = 80,0

[State 230, Envshake]
type = Envshake
trigger1 = movecontact
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 230, hitspark]
type = helper
trigger1 = time
trigger1 = movecontact
name = "Spark"
ID = 10000
postype = p2
pos = target,const(size.ground.front)-15,-73-ceil(p2bodydist Y)
stateno = 10000 + (20*moveguarded)
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 230, Poweradd]
type = poweradd
trigger1 = animelemtime(6) = 0
value = 40

[State 230, Cancel]
type = varset
trigger1 = animelemtime(7) = -1
trigger1 = movecontact
v = 2
value = 1

[State 230, Idle]
type = statetypeset
trigger1 = animelemtime(7) = 0
movetype = I

[State 230, End]
type = changestate
trigger1 = animtime = 0
value = 0
ctrl = 1

;---------------------------------------------------------------------------
;Crouching A
[Statedef 400]
type = C
physics = C
anim = 400
ctrl = 0
sprpriority = 2
facep2 = 1
movetype = A

[State 200, Cornerpush Physics]
type = velset
trigger1 = numtarget
trigger1 = target, gethitvar(hittime) < 0
trigger1 = movetype = I
trigger1 = vel X < 0
x = 0

[State 400, Snd]
type = PlaySnd
trigger1 = !time
value = 0,0
channel = 0

[State 400, Whoosh]
type = PlaySnd
trigger1 = animelemtime(2) = 0
value = 1,0

[State 400, Cancel]
type = varset
trigger1 = !time
v = 2
value = 0

[State 400, Vel Adjust]
type = varset
triggerall = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) = 0
trigger2 = p2movetype != H
fv = 1
value = 0

[State 400, Vel Adjust]
type = varset
trigger1 = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) >= 1
fv = 1
value = -.9 + .72*((enemy, gethitvar(hitcount))-1)

[State 400, Hitdef]
type = Hitdef
trigger1 = !time
attr = C,NA
hitflag = MAF
guardflag = MA
animtype = light
priority = 3, hit
damage = ceil(24*fvar(5)),0
pausetime = 9,9
guard.pausetime = 9, 8
sparkno = -1
guard.sparkno = -1
sparkxy = -10,-85
hitsound = S10,ifelse(fvar(4)>1,3,0)
guardsound = S800,2
ground.type = high
ground.slidetime = 7
ground.hittime = 10
air.hittime = 10
air.velocity = -3,-4.86+fvar(1)
yaccel = .68
ground.velocity = -4.3051242
guard.velocity =  -4.8570632
ground.cornerpush.veloff = -4.8570632*1.2
airguard.velocity = -2.5,-2
fall = (p2statetype = A) && (p2movetype = H)
fall.recovertime = 900
getpower = 30,10
givepower = 10,0

[State 400, hitspark]
type = helper
trigger1 = time
trigger1 = movecontact
name = "Spark"
ID = 10000
postype = p2
pos = target,const(size.ground.front)-10,-60-ceil(p2bodydist Y)
stateno = 10000 + (20*moveguarded)
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 400, Cancel]
type = varset
trigger1 = animelemtime(3) = -1
trigger1 = movecontact
v = 2
value = 1

[State 400, Idle]
type = statetypeset
trigger1 = animelemtime(3) = 0
movetype = I

[State 400, End]
type = changestate
trigger1 = animtime = 0
value = 11
ctrl = 1

;---------------------------------------------------------------------------
;Crouching B
[Statedef 410]
type = C
physics = C
anim = 410
ctrl = 0
sprpriority = 2
facep2 = 1
movetype = A

[State 200, Cornerpush Physics]
type = velset
trigger1 = numtarget
trigger1 = target, gethitvar(hittime) < 0
trigger1 = movetype = I
trigger1 = vel X < 0
x = 0

[State 410, Voice]
type = PlaySnd
trigger1 = !time
value = 0,1

[State 410, Cancel]
type = varset
trigger1 = !time
v = 2
value = 0

[State 410, Whoosh]
type = PlaySnd
trigger1 = animelemtime(2) = 0
value = 1,0

[State 410, Vel Adjust]
type = varset
triggerall = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) = 0
trigger2 = p2movetype != H
fv = 1
value = 0

[State 410, Vel Adjust]
type = varset
trigger1 = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) >= 1
fv = 1
value = .72*(enemy, gethitvar(hitcount))

[State 410, Hitdef]
type = Hitdef
trigger1 = !time
attr = C,NA
hitflag = MAF
guardflag = MA
animtype = medium
priority = 4, hit
damage = ceil(52*fvar(5)),0
pausetime = 10,10
guard.pausetime = 9, 9
sparkno = -1
guard.sparkno = -1
sparkxy = -10,-85
hitsound = S10,ifelse(fvar(4)>1,3,1)
guardsound = S12,1
ground.type = high
ground.slidetime = 9
ground.hittime = 14
air.hittime = 14
air.velocity = -2,-6.48+fvar(1)
yaccel = .68
ground.velocity = -6.6373145
guard.velocity =  -7.2327207
ground.cornerpush.veloff = -7.2327207*1.2
airguard.velocity = -2.5,-4
fall = (p2statetype = A) && (p2movetype = H)
fall.recovertime = 900
getpower = 60,20
givepower = 30,0

[State 410, hitspark]
type = helper
trigger1 = time
trigger1 = movecontact
name = "Spark"
ID = 10000
postype = p2
pos = target,const(size.ground.front)-10,-89-ceil(p2bodydist Y)
stateno = 10000 + (20*moveguarded)
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 410, Poweradd]
type = poweradd
trigger1 = animelemtime(2) = 0
value = 10

[State 410, Cancel]
type = varset
trigger1 = animelemtime(3) = -1
trigger1 = movecontact
v = 2
value = 1

[State 410, Idle]
type = statetypeset
trigger1 = animelemtime(3) = 0
movetype = I
type = S

[State 410, End]
type = changestate
trigger1 = animtime = 0
value = 0
ctrl = 1

;---------------------------------------------------------------------------
;Crouching C
[Statedef 420]
type = C
physics = C
anim = 420
ctrl = 0
sprpriority = 2
facep2 = 1
movetype = A

[State 200, Cornerpush Physics]
type = velset
trigger1 = numtarget
trigger1 = target, gethitvar(hittime) < 0
trigger1 = movetype = I
trigger1 = vel X < 0
x = 0

[State 420, Snd]
type = PlaySnd
trigger1 = animelemtime(2) = 0
value = 0,2

[State 420, Whoosh]
type = PlaySnd
trigger1 = animelemtime(3) = 0
value = 1,0

[State 420, Cancel]
type = varset
trigger1 = !time
v = 2
value = 0

[State 420, Vel Adjust]
type = varset
triggerall = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) = 0
trigger2 = p2movetype != H
fv = 1
value = 0

[State 420, Vel Adjust]
type = varset
trigger1 = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) >= 1
fv = 1
value = .72*(enemy, gethitvar(hitcount))

[State 420, Hitdef]
type = Hitdef
trigger1 = !time
trigger1 = enemy, statetype != L
attr = C,NA
hitflag = MAFD
guardflag = L
animtype = back
priority = 5, hit
damage = ceil(80*ifelse(p2statetype =L,.25,1)*fvar(5)),0
pausetime = 2,2
guard.pausetime = 2,2
sparkno = -1
guard.sparkno = -1
sparkxy = -10,-85
hitsound = S10,ifelse(fvar(4)>1,3,2)
guardsound = S12,0
ground.type = high
ground.slidetime = 14
ground.hittime = 14
air.hittime = 14
;air.velocity = -3,-7.5+fvar(1)
yaccel = .68
ground.velocity = -3,-7.5
guard.velocity =  -9.2785539
ground.cornerpush.veloff = -9.2785539*1.2
;airguard.velocity = -2.5,-6
fall = 1
fall.recovertime = 900
getpower = 90,30
givepower = 50,0

[State 420, Hitdef]
type = Hitdef
trigger1 = !time
trigger1 = enemy, statetype = L
attr = C,NA
hitflag = MAFD
guardflag = L
animtype = back
priority = 5, hit
damage = ceil(80*ifelse(p2statetype =L,.25,1)*fvar(5)),0
pausetime = 2,2
guard.pausetime = 2,2
sparkno = -1
guard.sparkno = -1
sparkxy = -10,-85
hitsound = S10,ifelse(fvar(4)>1,3,2)
guardsound = S12,0
ground.type = high
ground.slidetime = 14
ground.hittime = 14
air.hittime = 14
;air.velocity = -3,-7.5+fvar(1)
yaccel = .68
ground.velocity = -3,-7.5
guard.velocity =  -9.2785539
ground.cornerpush.veloff = -9.2785539*1.2
;airguard.velocity = -2.5,-6
fall = 1
fall.recovertime = 900
getpower = 90,30
givepower = 50,0
ID=420
NochainID=420

[State 420, Envshake]
type = Envshake
trigger1 = movecontact
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 420, hitspark]
type = helper
trigger1 = time
trigger1 = movecontact
name = "Spark"
ID = 10000
postype = p2
pos = target,const(size.ground.front)-20,-8-ceil(p2bodydist Y)
stateno = 10000 + (20*moveguarded)
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 420, Poweradd]
type = poweradd
trigger1 = animelemtime(4) = 0
value = 20

[State 420, Idle]
type = statetypeset
trigger1 = animelemtime(5) = 0
movetype = I

[State 420, End]
type = changestate
trigger1 = animtime = 0
value = 11
ctrl = 1

;---------------------------------------------------------------------------
;Jumping A
[Statedef 600]
type = A
physics = A
anim = 600
ctrl = 0
sprpriority = 2
movetype = A

[State 600, Cancel]
type = varset
trigger1 = !time
v = 2
value = 0

[State 600, Voice]
type = PlaySnd
trigger1 = !time
value = 0,0
channel = 0

[State 600, Whoosh]
type = PlaySnd
trigger1 = animelemtime(2) = 0
value = 1,0

[State 600, Vel Adjust]
type = varset
triggerall = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) = 0
trigger2 = p2movetype != H
fv = 1
value = 0

[State 600, Vel Adjust]
type = varset
trigger1 = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) >= 1
fv = 1
value = -.9 + .72*((enemy, gethitvar(hitcount))-1)

[State 600, Hitdef]
type = Hitdef
trigger1 = !time
attr = A,NA
hitflag = HAF
guardflag = HA
animtype = light
priority = 3, hit
damage = ceil(31*fvar(5)),0
pausetime = 9,9
guard.pausetime = 9, 8
sparkno = -1
guard.sparkno = -1
sparkxy = -10,-85
hitsound = S10,ifelse(fvar(4)>1,3,0)
guardsound = S800,2
ground.type = high
ground.slidetime = 9
ground.hittime = 10
air.hittime = 10
air.velocity = -2,-4.86+fvar(1)
yaccel = .68
ground.velocity = -3.8066951
guard.velocity =  -4.2947329
ground.cornerpush.veloff = -4.2947329*1.2
airguard.velocity = -2.5,-2
fall = (p2statetype = A) && (p2movetype = H)
fall.recovertime = 900
getpower = 40,20
givepower = 20,0

[State 600, hitspark]
type = helper
trigger1 = time
trigger1 = movecontact
name = "Spark"
ID = 10000
postype = p2
pos = target,const(size.ground.front)-10,-93-ceil(p2bodydist Y)
stateno = 10000 + (20*moveguarded)
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 600, Idle]
type = statetypeset
trigger1 = animelemtime(4) = 0
movetype = I

[State 600, End]
type = changestate
trigger1 = animtime = 0
value = 50
ctrl = 1

;---------------------------------------------------------------------------
;Jumping B
[Statedef 610]
type = A
physics = A
anim = 610
ctrl = 0
sprpriority = 2
movetype = A

[State 610, Cancel]
type = varset
trigger1 = !time
v = 2
value = 0

[State 610, Voice]
type = PlaySnd
trigger1 = !time
value = 0,1
channel = 0

[State 610, Whoosh]
type = PlaySnd
trigger1 = animelemtime(2) = 0
value = 1,0

[State 610, Vel Adjust]
type = varset
triggerall = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) = 0
trigger2 = p2movetype != H
fv = 1
value = 0

[State 610, Vel Adjust]
type = varset
trigger1 = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) >= 1
fv = 1
value = .72*(enemy, gethitvar(hitcount))

[State 610, Hitdef]
type = Hitdef
trigger1 = !time
attr = A,NA
hitflag = MAF
guardflag = HA
animtype = medium
priority = 4, hit
damage = ceil(66*fvar(5)),0
pausetime = 9,9
guard.pausetime = 9, 8
sparkno = -1
guard.sparkno = -1
sparkxy = -10,-85
hitsound = S10,ifelse(fvar(4)>1,3,1)
guardsound = S12,1
ground.type = high
ground.slidetime = 7
ground.hittime = 10
air.hittime = 10
air.velocity = -2,-6.48+fvar(1)
yaccel = .68
ground.velocity = -4.3051242
guard.velocity =  -7.9479215
ground.cornerpush.veloff = -7.9479215*1.2
airguard.velocity = -2.5,-4
fall = (p2statetype = A) && (p2movetype = H)
fall.recovertime = 900
getpower = 70,20
givepower = 40,0

[State 610, hitspark]
type = helper
trigger1 = time
trigger1 = movecontact
name = "Spark"
ID = 10000
postype = p2
pos = target,const(size.ground.front)-5,-40-ceil(p2bodydist Y)
stateno = 10000 + (20*moveguarded)
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 610, Poweradd]
type = poweradd
trigger1 = animelemtime(4) = 0
value = 20

[State 610, Idle]
type = statetypeset
trigger1 = animelemtime(8) = 0
movetype = I

[State 610, End]
type = changestate
trigger1 = animtime = 0
value = 50
ctrl = 1

;---------------------------------------------------------------------------
;Neutral Jumping C
[Statedef 620]
type = A
physics = A
anim = 620
ctrl = 0
sprpriority = 2
movetype = A

[State 620, Voice]
type = PlaySnd
trigger1 = !time
value = 0,2

[State 620, Whoosh]
type = PlaySnd
trigger1 = animelemtime(2) = 0
value = 1,0

[State 620, Cancel]
type = varset
trigger1 = !time
v = 2
value = 0

[State 620, Vel Adjust]
type = varset
triggerall = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) = 0
trigger2 = p2movetype != H
fv = 1
value = 0

[State 620, Vel Adjust]
type = varset
trigger1 = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) >= 1
fv = 1
value = .72*(enemy, gethitvar(hitcount))

[State 620, Hitdef]
type = Hitdef
trigger1 = !time
attr = A,NA
hitflag = MAF
guardflag = HA
animtype = back
priority = 5, hit
damage = ceil(101*fvar(5)),0
pausetime = 9,9
guard.pausetime = 9,8
sparkno = -1
guard.sparkno = -1
sparkxy = -10,-85
hitsound = S10,ifelse(fvar(4)>1,3,2)
guardsound = S12,0
ground.type = high
ground.slidetime = 13
ground.hittime = 13
air.hittime = 13
air.velocity = -5,-9+fvar(1)
yaccel = .68
ground.velocity = -5,-10
guard.velocity =  -9.1287114
ground.cornerpush.veloff = -9.1287114*1.2
airguard.velocity = -2.5,-6
fall = 1
fall.recovertime = 900
getpower = 110,40
givepower = 70,0

[State 620, Envshake]
type = Envshake
trigger1 = movecontact
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 620, hitspark]
type = helper
trigger1 = time
trigger1 = movecontact
name = "Spark"
ID = 10000
postype = p2
pos = target,const(size.ground.front)-20,-71-ceil(p2bodydist Y)
stateno = 10000 + (20*moveguarded)
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 620, Poweradd]
type = poweradd
trigger1 = animelemtime(2) = 0
value = 30

[State 620, Idle]
type = statetypeset
trigger1 = animelemtime(3) = 0
movetype = I

[State 620, End]
type = changestate
trigger1 = animtime = 0
value = 50
ctrl = 1

;---------------------------------------------------------------------------
;Jumping C
[Statedef 630]
type = A
physics = A
anim = 630
ctrl = 0
sprpriority = 2
movetype = A

[State 630, voice]
type = PlaySnd
trigger1 = !time
value = 0,2
channel = 0

[State 630, Whoosh]
type = PlaySnd
trigger1 = animelemtime(2) = 0
value = 1,0

[State 630, Cancel]
type = varset
trigger1 = !time
v = 2
value = 0

[State 630, Vel Adjust]
type = varset
triggerall = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) = 0
trigger2 = p2movetype != H
fv = 1
value = 0

[State 630, Vel Adjust]
type = varset
trigger1 = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) >= 1
fv = 1
value = .72*(enemy, gethitvar(hitcount))

[State 630, Hitdef]
type = Hitdef
trigger1 = !time
attr = A,NA
hitflag = MAF
guardflag = HA
animtype = back
priority = 5, hit
damage = ceil(83*fvar(5)),0
pausetime = 9,9
guard.pausetime = 9,8
sparkno = -1
guard.sparkno = -1
sparkxy = -10,-85
hitsound = S10,ifelse(fvar(4)>1,3,2)
guardsound = S12,0
ground.type = high
ground.slidetime = 7
ground.hittime = 14
air.hittime = 14
air.velocity = -2,-8.1+fvar(1)
yaccel = .68
ground.velocity = -7.6167581
guard.velocity =  -11.7011067
ground.cornerpush.veloff = -11.7011067*1.2
airguard.velocity = -2.5,-6
fall = (p2statetype = A) && (p2movetype = H)
fall.recovertime = 900
getpower = 90,30
givepower = 60,0

[State 630, Envshake]
type = Envshake
trigger1 = movecontact
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 630, hitspark]
type = helper
trigger1 = time
trigger1 = movecontact
name = "Spark"
ID = 10000
postype = p2
pos = target,const(size.ground.front)-20,-49-ceil(p2bodydist Y)
stateno = 10000 + (20*moveguarded)
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 630, Poweradd]
type = poweradd
trigger1 = animelemtime(2) = 0
value = 30

[State 630, Idle]
type = statetypeset
trigger1 = animelemtime(3) = 0
movetype = I

[State 630, End]
type = changestate
trigger1 = animtime = 0
value = 50
ctrl = 1

;---------------------------------------------------------------------------
;Boobs
[Statedef 640]
type = A
physics = A
anim = 640
ctrl = 0
sprpriority = 2
movetype = A
velset = vel X, -6.57

[State 640, Cancel]
type = varset
trigger1 = !time
v = 2
value = 0

[State 640, Afterimages]
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

[State 640, Voice]
type = PlaySnd
trigger1 = animelemtime(2) = 0
value = 640,0
channel = 0

[State 640, Whoosh]
type = PlaySnd
trigger1 = animelemtime(3) = 0
value = 1,0

[State 640, Vel Adjust]
type = varset
triggerall = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) = 0
trigger2 = p2movetype != H
fv = 1
value = 0

[State 640, Vel Adjust]
type = varset
trigger1 = !time
trigger1 = p2movetype = H
trigger1 = enemy, gethitvar(hitcount) >= 1
fv = 1
value = .72*(enemy, gethitvar(hitcount))

[State 640, Hitdef]
type = Hitdef
trigger1 = !time
attr = A,NA
hitflag = MAF
guardflag = HA
animtype = back
priority = 5, hit
damage = ceil(83*fvar(5)),0
pausetime = 9,9
guard.pausetime = 9,8
sparkno = -1
guard.sparkno = -1
sparkxy = -10,-85
hitsound = S10,ifelse(fvar(4)>1,3,2)
guardsound = S12,0
ground.type = high
ground.slidetime = 13
ground.hittime = 13
air.hittime = 13
air.velocity = -5,13.5+fvar(1)
yaccel = .68
ground.velocity = -5,15
guard.velocity =  -9.0945853
ground.cornerpush.veloff = -9.0945853*1.2
airguard.velocity = -2.5,-6
fall = 1
fall.recovertime = 900
getpower = 120,60
givepower = 60,0

[State 640, hitspark]
type = helper
trigger1 = time
trigger1 = movecontact
name = "Spark"
ID = 10000
postype = p2
pos = target,const(size.ground.front)-5,-60-ceil(p2bodydist Y)
stateno = 10000 + (20*moveguarded)
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 640, Poweradd]
type = poweradd
trigger1 = Pos Y + Vel Y >= 0
trigger1 = !movecontact
value = 30

[State 640, End]
type = changestate
trigger1 = Pos Y + Vel Y >= 0
value = 641
ctrl = 1

[Statedef 641]
type = C
physics = C
anim = 641
ctrl = 0
sprpriority = 0
movetype = I
velset = 0,0

[State 641, Afterimages]
type = AfterImageTime
trigger1 = !time
time = 0

[State 641, Envshake]
type = Envshake
trigger1 = !time
time = 7
freq = 90
ampl = -3

[State 641, Snd]
type = PlaySnd
trigger1 = !time
value = 640,1

[State 641, 0]
type = PosSet
trigger1 = !time
y = 0

[State 641, End]
type = Changestate
trigger1 = animtime = 0
value = 11
ctrl = 1

;---------------------------------------------------------------------------
;Roll
[Statedef 430]
type = C
physics = N
anim = 430
ctrl = 0
sprpriority = 1
velset = 5.5, 0

[State 430, Dust]
type = helper
trigger1 = !time
name = "Dust Helper"
ID = 10019
pos = 0,0
stateno = 10018
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 430, Whoosh]
type = PlaySnd
trigger1 = !time
value = 100,0

[State 430, Correction]
type = posset
trigger1 = pos y < 0
y = 0

[State 430, Correction]
type = width
trigger1 = prevstateno = 816
edge = 30,0

[State 430, Correction]
type = veladd
triggerall = !time
trigger1 = prevstateno = 816
x = -.5

[State 430, Push]
type = playerpush
trigger1 = prevstateno = 816
value = 0

[State 430, slowdown]
type = veladd
trigger1 = 1
x = -.025

[State 430, Invuln]
type = nothitby
trigger1 = 1
value = A

[State 430, slowdown]
type = velset
trigger1 = animtime = 0
x = 0

[State 430, End]
type = Changestate
trigger1 = animtime = 0
value = 0
ctrl = 1

;---------------------------------------------------------------------------
; Neutral Throw
[Statedef 800]
type = S
physics = S
anim = 800
ctrl = 0
sprpriority = 2
facep2 = 1
movetype = A

[State 800, Throw]
type = hitdef
trigger1 = p2bodydist X <= 32
trigger1 = enemynear, stateno != [150,152]
attr = S,NT
hitflag = M-
guardflag = 
guard.dist = -1
priority = 1, miss
sparkno = -1
sparkxy = -10,-85
hitsound = S800,2
ground.type = high
ground.velocity = 2.45,0
ground.slidetime = 16
ground.hittime = 16
yaccel = .68
getpower = 0,0
givepower = 0,0
p1stateno = 801
p2facing = 1
ID=420

[State 800, Miss]
type = statetypeset
trigger1 = animelemtime(3) = 0
movetype = I

[State 800, Miss]
type = changestate
trigger1 = animtime = 0
value = 0
ctrl = 1

[Statedef 801]
type = S
physics = S
anim = 801
ctrl = 0
sprpriority = 2

[State 801, Voice]
type = playsnd
trigger1 = !time
value = 800,0
channel = 0

[State 801, Targetstate]
type = targetstate
trigger1 = animelemtime(5) = 1
value = 802

[State 801, End]
type = Changestate
trigger1 = animtime = 0
value = 0
ctrl = 1

[Statedef 802]
type = A
physics = N
velset = -2.5,-4.2
movetype = H

[State 802, Gravity]
type = veladd
trigger1 = 1
x = 0.05
y = 0.68

[State 802, Anim]
type = changeanim
trigger1 = !time
value = 5070

[State 802, Anim]
type = null
trigger1 = anim = 802
trigger1 = animtime = 0
value = 5050

[State 802, Damage]
type = lifeadd
trigger1 = Pos Y < 32
trigger1 = Vel Y + Pos Y >= 32
value = ceil(-146*(enemy,fvar(2))*(ifelse(gethitvar(hitcount)>=4,.25,ifelse(gethitvar(hitcount)=3,.5,ifelse(gethitvar(hitcount)=2,.75,1)))))

[State 802, Envshake]
type = Envshake
trigger1 = Pos Y < 32
trigger1 = Vel Y + Pos Y >= 32
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 802, Land]
type = velset
trigger1 = Pos Y < 32
trigger1 = Vel Y + Pos Y >= 32
y = 0

[State 802, Land]
type = posset
trigger1 = vel y = 0
trigger1 = Pos Y > 0
y = 0

[State 802, Land]
type = SelfState
trigger1 = vel y = 0
trigger1 = pos y = 0
value = 5100

;---------------------------------------------------------------------------
;Forward Throw
[Statedef 805]
type = S
physics = S
anim = 800
ctrl = 0
sprpriority = 2
facep2 = 1
movetype = A

[State 805, Throw]
type = hitdef
trigger1 = p2bodydist X <= 32
trigger1 = enemynear, stateno != [150,152]
attr = S,NT
hitflag = M-
guardflag = 
guard.dist = -1
priority = 1, miss
sparkno = -1
sparkxy = -10,-85
hitsound = S800,2
ground.type = high
yaccel = .68
getpower = 0,0
givepower = 0,0
p1stateno = 806
p2stateno = 807
p2facing = 1
ID=420

[State 805, Miss]
type = statetypeset
trigger1 = animelemtime(3) = 0
movetype = I

[State 805, Miss]
type = changestate
trigger1 = animtime = 0
value = 0
ctrl = 1

[Statedef 806]
movetype = A
sprpriority = 2
anim = 805

[State 806, Voice]
type = playsnd
trigger1 = !time
value = 800,1
channel = 0

[State 806, End]
type = changestate
trigger1 = animtime = 0
value = 0
ctrl = 1

[Statedef 807]
movetype = H
physics = N
type = S
ctrl = 0

[State 807, Anim]
type = changeanim
trigger1 = !time
value = 5001

[State 807, Anim]
type = changeanim2
trigger1 = time = 6
value = 806

[State 807, Turn]
type = turn
trigger1 = time = 6
trigger2 = time = 20

[State 807, Move]
type = velset
trigger1 = time = 6
trigger2 = time = 20
x = -5

[State 807, LifeAdd]
type = LifeAdd
trigger1 = time = 30
value = ceil(-83*(enemy,fvar(2))*(ifelse(gethitvar(hitcount)>=4,.25,ifelse(gethitvar(hitcount)=3,.5,ifelse(gethitvar(hitcount)=2,.75,1)))))

[State 807, Friction]
type = veladd
trigger1 = time = [6,20)
x = .05

[State 807, Friction]
type = veladd
trigger1 = time = [20,40)
x = .075

[State 807, Stop]
type = velset
trigger1 = time = 38
x = 0

[State 807, End]
type = selfstate
trigger1 = time = 38
value = 0
ctrl = 1

;---------------------------------------------------------------------------
;Backwards Throw
[Statedef 810]
type = S
physics = S
anim = 800
ctrl = 0
sprpriority = 2
facep2 = 1
movetype = A

[State 810, Throw]
type = hitdef
trigger1 = p2bodydist X <= 32
trigger1 = enemynear, stateno != [150,152]
attr = S,NT
hitflag = M-
guardflag = 
guard.dist = -1
priority = 1, miss
sparkno = -1
sparkxy = -10,-85
hitsound = S800,2
ground.type = high
yaccel = .68
getpower = 0,0
givepower = 0,0
p1stateno = 811
p2stateno = 812
p2facing = 1
ID=420

[State 810, Miss]
type = statetypeset
trigger1 = animelemtime(3) = 0
movetype = I

[State 810, Miss]
type = changestate
trigger1 = animtime = 0
value = 0
ctrl = 1

[Statedef 811]
movetype = A
sprpriority = 2
anim = 810

[State 811, Voice]
type = playsnd
trigger1 = !time
value = 800,1
channel = 0

[State 811, Turn]
type = Turn
trigger1 = !time

[State 811, End]
type = changestate
trigger1 = animtime = 0
value = 0
ctrl = 1

[Statedef 812]
movetype = H
physics = N
type = S
ctrl = 0

[State 812, Anim]
type = changeanim
trigger1 = !time
value = 5001

[State 812, Anim]
type = changeanim2
trigger1 = time = 7
value = 806

[State 812, Move]
type = velset
trigger1 = time = 7
x = 5

[State 812, Friction]
type = veladd
trigger1 = time = [7,27)
x = .05

[State 812, LifeAdd]
type = LifeAdd
trigger1 = time = 21
value = ceil(-83*(enemy,fvar(2))*(ifelse(gethitvar(hitcount)>=4,.25,ifelse(gethitvar(hitcount)=3,.5,ifelse(gethitvar(hitcount)=2,.75,1)))))

[State 812, Stop]
type = velset
trigger1 = time = 27
x = 0

[State 812, End]
type = selfstate
trigger1 = time = 27
value = 0
ctrl = 1

;---------------------------------------------------------------------------
;Air Throw
[Statedef 815]
type = A
physics = A
anim = 815
ctrl = 0
sprpriority = 2
movetype = A

[State 815, Throw]
type = hitdef
trigger1 = p2bodydist X <= 32
trigger1 = enemynear, stateno != [150,152]
attr = A,NT
hitflag = AF
guardflag = 
guard.dist = -1
priority = 1, miss
sparkno = -1
sparkxy = -10,-85
hitsound = S800,2
ground.type = high
yaccel = .68
getpower = 0,0
givepower = 0,0
p1stateno = 816
p2stateno = 817
p2facing = 1
fall = 1
fall.recover = 0
ID=420

[State 815, Miss]
type = statetypeset
trigger1 = animelemtime(3) = 0
movetype = I

[State 815, Miss]
type = changestate
trigger1 = animtime = 0
value = 50
ctrl = 1

[Statedef 816]
movetype = A
type = A
physics = A
sprpriority = 2
anim = 816
velset = 5,-7.32

[State 816, Voice]
type = playsnd
trigger1 = !time
value = 640,0
channel = 0

[State 816, Push]
type = playerpush
trigger1 = 1
value = 0

[State 816, Bind]
type = targetbind
trigger1 = 1
pos = -1,0

[State 816, Hitsound]
type = playsnd
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y >= 0
value = 10,2

[State 816, Envshake]
type = Envshake
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y >= 0
time = 7
freq = 90
ampl = -3
ignorehitpause = 1
persistent = 0

[State 816, End]
type = changestate
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y >= 0
value = 430

[Statedef 817]
movetype = H
physics = N
type = A
ctrl = 0
velset = -5,-7.32

[State 817, Push]
type = playerpush
trigger1 = 1
value = 0

[State 817, Anim]
type = changeanim
trigger1 = !time
value = 5070

[State 817, Land]
type = posset
trigger1 = Pos Y < 0
trigger1 = Vel Y + Pos Y > 0
y = 0

[State 817, Damage]
type = lifeadd
trigger1 = Pos Y = 0
value = ceil(-153*(enemy,fvar(2))*(ifelse(gethitvar(hitcount)>=4,.25,ifelse(gethitvar(hitcount)=3,.5,ifelse(gethitvar(hitcount)=2,.75,1)))))

[State 817, Slowdown]
type = velset
trigger1 = Pos Y = 0
x = -1

[State 817, Land]
type = SelfState
trigger1 = Pos Y = 0
value = 5110


;---------------------------------------------------------------------------
; Override common states (use same number to override) :
;---------------------------------------------------------------------------
; Walk
[Statedef 20]
type    = S
physics = S
sprpriority = 0

[State 20, Walk Sound]
type = Playsnd
trigger1 = time
trigger1 = animelemtime(3) = 0
value = 20,0
channel = 10

[State 20, Walk Sound]
type = Playsnd
trigger1 = time
trigger1 = animelemtime(7) = 0
value = 20,1
channel = 10

[State 20, 1]
type = VelSet
trigger1 = command = "holdfwd"
x = const(velocity.walk.fwd.x)

[State 20, 2]
type = VelSet
trigger1 = command = "holdback"
x = const(velocity.walk.back.x)

[State 20, 3]
type = ChangeAnim
triggerall = vel x > 0
trigger1 = Anim != 20 && Anim != 5
trigger2 = Anim = 5 && AnimTime = 0
value = 20

[State 20, 4]
type = ChangeAnim
triggerall = vel x < 0
trigger1 = Anim != 21 && Anim != 5
trigger2 = Anim = 5 && AnimTime = 0
value = 21

; Jump Start
[Statedef 40]
type    = S
physics = S
anim = 40
ctrl = 0
sprpriority = 1
facep2 = 1

[State 40, 1]
type = VarSet
trigger1 = Time = 0
sysfvar(1) = 0

[State 40, 2]
type = VarSet
trigger1 = command = "holdfwd"
sysfvar(1) = 1

[State 40, 3]
type = VarSet
trigger1 = command = "holdback"
sysfvar(1) = -1

[State 40, 4]
type = VelSet
trigger1 = AnimTime = 0
x = ifelse(sysfvar(1)=0, const(velocity.jump.neu.x), ifelse(sysfvar(1)=1, const(velocity.jump.fwd.x), const(velocity.jump.back.x)))
y = ifelse(sysfvar(1)=0, -10.82, ifelse(sysfvar(1)=1, -9.82, -9.64))

[State 40, Snd]
type = PlaySnd
trigger1 = animtime = 0
value = 40,0

[State 40, 6]
type = ChangeState
trigger1 = AnimTime = 0
value = 50
ctrl = 1

;---------------------------------------------------------------------------
; Jump Land
[Statedef 52]
type    = S
physics = S
ctrl = 0
anim = 47

[State 52, Snd]
type = PlaySnd
trigger1 = !time
value = 40,0

[State 100, Dust]
type = helper
trigger1 = !time
name = "Dust Helper"
ID = 10019
pos = 0,0
stateno = 10018
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 52, 1]
type = VelSet
trigger1 = Time = 0
x = 0
y = 0

[State 52, 2]
type = PosSet
trigger1 = Time = 0
y = 0

[State 52, 3]
type = turn
trigger1 = animtime = 0
trigger1 = p2dist X < 0

[State 52, 4]
type = ChangeState
trigger1 = AnimTime = 0
value = 12
ctrl = 1

;---------------------------------------------------------------------------
; RUN_FWD
[Statedef 100]
type    = S
physics = N
anim = 100
sprpriority = 1
ctrl = 0

[State 100, 1]
type = VelSet
trigger1 = !time
x = const(velocity.run.fwd.x)

[State 100, Dash Sound]
type = Playsnd
trigger1 = !time
value = 100,0

[State 100, Dust]
type = helper
trigger1 = !time
name = "Dust Helper"
ID = 10019
pos = 0,0
stateno = 10018
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 100, Slowdown]
type = veladd
trigger1 = time
x = -.025

[State 100, 3] ;Prevent from turning
type = AssertSpecial
trigger1 = 1
flag = NoAutoTurn

[State 100, 1]
type = VelSet
trigger1 = time = 12
x = 0

[State 100, 4]
type = ChangeState
trigger1 = time = 12
value = 0
ctrl = 1

;---------------------------------------------------------------------------
; RUN_BACK
[Statedef 105]
type    = S
physics = S
ctrl = 0
anim = 105
sprpriority = 1

[State 105, Invince]
type = nothitby
trigger1 = animelemtime(2)>=0
trigger1 = animelemtime(4)<0
value = SCA

[State 105, 1]
type = VelSet
trigger1 = Time = 2
x = const(velocity.run.back.x)
y = const(velocity.run.back.y)

[State 105, StatetypeSet]
type = statetypeset
trigger1 = time = 2
statetype = A
physics = N

[State 105, Gravity]
type = Veladd
trigger1 = pos Y < 0
x = .025
y = .68

[State 105, 3]
type = ChangeState
trigger1 = Pos Y > 0
trigger1 = Vel Y + Pos Y >= 0
value = 106

;---------------------------------------------------------------------------
; RUN_BACK2 (land)
[Statedef 106]
type    = S
physics = S
ctrl = 0
anim = 106

[State 106, 1]
type = VelSet
trigger1 = Time = 0
y = 0

[State 106, 1]
type = VelSet
trigger1 = Time = 2
x = 0

[State 106, 2]
type = PosSet
trigger1 = Time = 0
y = 0

[State 106, Dust]
type = helper
trigger1 = time = 0
name = "Dust Helper"
ID = 10019
pos = 0,0
stateno = 10018
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 106, Sound]
type = playsnd
trigger1 = time = 0
value = 40,0

[State 106, 4]
type = ChangeState
trigger1 = animtime = 0
value = 0
ctrl = 1

;---------------------------------------------------------------------------
; HIT_FALLRECOVER (still falling)
[Statedef 5200]
type    = A
movetype= H
physics = N

[State 5200, 1] ;Change anim if done with transition
type = ChangeAnim
trigger1 = Anim = 5035
trigger1 = AnimTime = 0
value = 5050

[State 5200, 2]
type = VelAdd
trigger1 = 1
y = GetHitVar(yaccel)

[State 5200, 3]
type = SelfState
trigger1 = Vel Y > 0
trigger1 = Pos Y >= 0
value = 5201

;---------------------------------------------------------------------------
; HIT_FALLRECOVER (on the ground)
[Statedef 5201]
type    = C
movetype= H
physics = N
anim = 5200
ctrl = 0

[State 5201, 2]
type = VelSet
trigger1 = !Time
x = 2.25 * ifelse(vel X < 0,-1,1)
y = 0

[State 5201, Vel]
type = VelSet
trigger1 = animelemtime(5) = 0
x = 0
y = 0

[State 5201, 1] ;Turn if going the wrong way
type = Turn
trigger1 = !Time
trigger1 = vel x > 0

[State 5201, 3]
type = PosSet
trigger1 = !Time
y = 0

[State 5201, 4]
type = NotHitBy
trigger1 = 1
value = SCA
time = 1

[State 5201, 5] ;Blink white
type = PalFX
trigger1 = Time = 0
trigger2 = time = 20
time = 20
sinadd = 128,128,128,40 ;256,256,256

[State 5201, Dust]
type = helper
trigger1 = !time
name = "Dust Helper"
ID = 10019
pos = 0,0
stateno = 10018
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 5201, Sound]
type = playsnd
trigger1 = !time
value = 100,0

[State 5201, End]
type = changestate
trigger1 = animtime = 0
value = 11
ctrl = 1

;---------------------------------------------------------------------------
; Reflect Guard
[Statedef 160]
type = U
physics = U
ctrl = 0

[State 160, Effect]
type = explod
trigger1 = !time
anim = 10017
id = 160
pos = 23,-56
ownpal = 1
ontop = 1
removeongethit = 1
bindtime = -1
scale = const(size.xscale),const(size.yscale)

[State 160, changetype]
type = statetypeset
trigger1 = statetype = S
trigger1 = command = "holddown"
statetype = C

[State 160, changetype]
type = statetypeset
trigger1 = statetype = C
trigger1 = command != "holddown"
statetype = S

[State 160, change]
type = changestate
trigger1 = !time
value = 164 + (statetype = C) + (statetype = A)*2
ignorehitpause = 1

;---------------------------------------------------------------------------
; Reflect Guard End
[Statedef 161]
type = U
physics = U
ctrl = 0

[State 161, 2]
type = VelAdd
trigger1 = pos y < 0
y = Const(movement.yaccel)

[State 161, 3]
type = VarSet
trigger1 = 1
sysvar(0) = (pos y >= 0) && (vel y > 0)

[State 161, 4]
type = VelSet
trigger1 = sysvar(0)
x = 0
y = 0

[State 161, 5]
type = PosSet
trigger1 = sysvar(0)
y = 0

[State 161, statetype]
type = statetypeset
trigger1 = sysvar(0)
statetype = S
physics = S

[State 161, anim]
type = changeanim
trigger1 = anim = 162
trigger1 = statetype = S
value = 160
elem = 2

[State 161, change]
type = changestate
trigger1 = time >= 24
trigger1 = statetype != A
value = 0 + (statetype = C)*11
ctrl = 1

;---------------------------------------------------------------------------
; Projectile Reflect Guard
[Statedef 162]
type = U
physics = U

[State 162, Remove]
type = removeexplod
trigger1 = !time
ID = 160
ignorehitpause = 1

[State 162, Play Sound]
type = playsnd
trigger1 = !time
value = 160,0

[State 162, spark]
type = helper
trigger1 = !time
name = "Spark"
ID = 10010
postype = p1
pos = const(size.mid.pos.x),const(size.mid.pos.y)
stateno = 10010
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 162, Cancel]
type = varset
trigger1 = time = 0
ignorehitpause = 1
var(2) = 1

[State 162, Pause]
type = pause
trigger1 = time = 0
time = 26
endcmdbuftime = 26
ignorehitpause = 1
persistent = 0

[State 162, Velocity]
type = velset
trigger1 = time = 0
x = fvar(6)
y = fvar(7)

[State -1, Reflect]
type = changestate
value = 160
triggerall = !var(0)
triggerall = time = 0
triggerall = command = "reflect"
trigger1 = var(2)

[State 162, end]
type = changestate
trigger1 = time = 1
value = 0 + 11*(statetype=C) + 50*(statetype=A)
ctrl = 1

;---------------------------------------------------------------------------
; Reflect Autocounter
[Statedef 163]
type = U
movetype = A
physics = U

[State 163, Cancel]
type = varset
trigger1 = !time
var(2) = 0

[State 163, statetype]
type = statetypeset
trigger1 = pos Y < 0
trigger1 = !time
physics = A

[State 163, anim]
type = changeanim
trigger1 = !time
value = anim + 3

[State 163, Hitdef]
type = Hitdef
trigger1 = time = 1
trigger1 = statetype != C
attr = S,NA
hitflag = MA
guardflag = MA
animtype = back
priority = 3, hit
damage = ceil(35*fvar(5)),0
pausetime = 10,13
guard.pausetime = 10, 10
sparkno = -1
sparkxy = -10,-85
hitsound = S10,2
guardsound = S12,0
ground.type = high
ground.hittime = 12
air.hittime = 99
yaccel = .68
ground.velocity = -3,-7.5
air.velocity = -3,-7.5
ground.cornerpush.veloff = -3*1.2
airguard.velocity = -3,-4
fall = 1
fall.recover = 0
getpower = 50,0
givepower = 20,0

[State 163, Hitdef]
type = Hitdef
trigger1 = time = 1
trigger1 = statetype = C
attr = C,NA
hitflag = MA
guardflag = MA
animtype = back
priority = 3, hit
damage = ceil(28*fvar(5)),0
pausetime = 10,13
guard.pausetime = 10, 10
sparkno = -1
sparkxy = -10,-85
hitsound = S10,2
guardsound = S12,0
ground.type = high
ground.hittime = 12
air.hittime = 99
yaccel = .68
ground.velocity = -3,-7.5
air.velocity = -3,-7.5
ground.cornerpush.veloff = -3*1.2
airguard.velocity = -3,-4
fall = 1
fall.recover = 0
getpower = 50,0
givepower = 20,0

[State 163, hitspark]
type = helper
trigger1 = time
trigger1 = movecontact=1
trigger1 = statetype = S
name = "Spark"
ID = 10000
postype = p2
pos = target,const(size.ground.front)-10,-74-ceil(p2bodydist Y)
stateno = 10000 + (20*moveguarded)
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 163, hitspark]
type = helper
trigger1 = time
trigger1 = movehit=1
trigger1 = statetype = C
name = "Spark"
ID = 10000
postype = p2
pos = target,const(size.ground.front)-10,-38-ceil(p2bodydist Y)
stateno = 10000 + (20*moveguarded)
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 163, hitspark]
type = helper
trigger1 = time
trigger1 = movehit=1
trigger1 = statetype = A
name = "Spark"
ID = 10000
postype = p2
pos = target,const(size.ground.front)-10,-63-ceil(p2bodydist Y)
stateno = 10000 + (20*moveguarded)
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 163, Cancel]
type = varset
trigger1 = movehit
trigger1 = animelemtime(3) = 0
var(2) = 1

[State 163, change]
type = changestate
trigger1 = animtime = 0
value = 0 + (statetype = C)*11 + (statetype = A)*50
ctrl = 1

;---------------------------------------------------------------------------
; STAND Reflect
[Statedef 164]
type    = S
physics = S
anim = 160

[State 164, playsnd]
type = playsnd
trigger1 = time = 2
trigger1 = prevstateno != 166
value = 0,0
volume = 255
channel = 1

[State 164, anim]
type = changeanim
trigger1 = anim = 162
value = 160
elem = 2

[State 164, Effect]
type = palfx
trigger1 = 1
time = 1
add = 0,64,192
mul = 0,256,208

[State 164, Projectile Reflect]
type = hitoverride
trigger1 = 1
attr = SCA, NP,SP,HP
stateno = 162
ignorehitpause = 1

[State 164, NoThrow]
type = nothitby
trigger1 = 1
value = , NT, ST, HT

[State 164, Kill those hoes]
type = reversaldef
trigger1 = 1
reversal.attr = SA, NA, SA, HA
attr = S,ST
hitflag = A
guardflag = 
guard.dist = -1
priority = 7, hit
sparkno = -1
hitsound = S160,0
getpower = 0,0
givepower = 0,0
p1stateno = 167
ignorehitpause = 1

[State 164, Reflect End]
type = Changestate
trigger1 = animelemtime(2) = 8
value = 161

;---------------------------------------------------------------------------
; CROUCH Reflect
[Statedef 165]
type    = C
physics = C
anim = 161

[State 165, playsnd]
type = playsnd
trigger1 = time = 2
value = 0,0
volume = 255
channel = 1

[State 165, Effect]
type = palfx
trigger1 = animelemtime(2) < 8
time = 1
add = 0,64,192
mul = 0,256,208

[State 165, Projectile Reflect]
type = hitoverride
trigger1 = 1
attr = SCA, NP,SP,HP
stateno = 162
ignorehitpause = 1

[State 165, NoThrow]
type = nothitby
trigger1 = 1
value = , NT, ST, HT

[State 165, Kill those hoes]
type = reversaldef
trigger1 = 1
reversal.attr = SC, NA, SA, HA
attr = S,ST
hitflag = A
guardflag = 
guard.dist = -1
priority = 7, hit
sparkno = -1
hitsound = S160,0
getpower = 0,0
givepower = 0,0
p1stateno = 168
ignorehitpause = 1

[State 165, Reflect End]
type = Changestate
trigger1 = animelemtime(2) = 8
value = 161

;---------------------------------------------------------------------------
; AIR Reflect
[Statedef 166]
type    = A
physics = N
anim = 162

[State 166, playsnd]
type = playsnd
trigger1 = time = 2
value = 0,0
volume = 255
channel = 1

[State 166, Effect]
type = palfx
trigger1 = animelemtime(2) < 8
time = 1
add = 0,64,192
mul = 0,256,208

[State 166, vel tracker]
type = null
trigger1 = fvar(6):=(vel x)
ignorehitpause = 1

[State 166, vel tracker]
type = null
trigger1 = fvar(7):=(vel y)
ignorehitpause = 1

[State 166, 2]
type = VelAdd
trigger1 = 1
y = Const(movement.yaccel)

[State 166, 3]
type = VarSet
trigger1 = 1
sysvar(0) = (pos y >= 0) && (vel y > 0)

[State 166, 4]
type = VelSet
trigger1 = sysvar(0)
y = 0

[State 166, 5]
type = PosSet
trigger1 = sysvar(0)
y = 0

[State 166, 7]
type = ChangeState
trigger1 = sysvar(0)
value = 164

[State 166, Projectile Reflect]
type = hitoverride
trigger1 = 1
attr = SCA, NP,SP,HP
stateno = 162
ignorehitpause = 1

[State 166, NoThrow]
type = nothitby
trigger1 = 1
value = , NT, ST, HT

[State 166, Kill those hoes]
type = reversaldef
trigger1 = 1
reversal.attr = SCA, NA, SA, HA
attr = S,ST
hitflag = A
guardflag = 
guard.dist = -1
priority = 7, hit
sparkno = -1
hitsound = S160,0
getpower = 0,0
givepower = 0,0
p1stateno = 169
ignorehitpause = 1

[State 166, Reflect End]
type = Changestate
trigger1 = animelemtime(2) = 8
value = 161

;---------------------------------------------------------------------------
; SGUARDHIT (shaking)
[Statedef 167]
type    = S
movetype= H
physics = N
velset = 0,0

[State 167, Remove]
type = removeexplod
trigger1 = !time
ID = 160
ignorehitpause = 1

[State 167, poweradd]
type = poweradd
trigger1 = !time
value = 210
persistent = 0

[State 167, spark]
type = helper
trigger1 = !time
name = "Spark"
ID = 10010
postype = p1
pos = const(size.mid.pos.x),const(size.mid.pos.y)
stateno = 10010
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 167, 3]
type = ForceFeedback
trigger1 = time = 0
waveform = square
time = 26

[State 167, Cancel]
type = varset
trigger1 = time = 0
var(2) = 1

[State 167, Pause]
type = pause
trigger1 = time = 0
time = 26;-1 * animelemtime(3)
endcmdbuftime = 26;-1 * animelemtime(3)

[State 167, Autocounter]
type = changestate
trigger1 = time = 1
value = 163

;---------------------------------------------------------------------------
; CGUARDHIT (shaking)
[Statedef 168]
type    = C
movetype= H
physics = N
velset = 0,0

[State 168, Remove]
type = removeexplod
trigger1 = !time
ID = 160
ignorehitpause = 1

[State 168, poweradd]
type = poweradd
trigger1 = !time
value = 210
persistent = 0

[State 168, spark]
type = helper
trigger1 = !time
name = "Spark"
ID = 10010
postype = p1
pos = const(size.mid.pos.x),const(size.mid.pos.y)
stateno = 10010
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 168, 4]
type = ForceFeedback
trigger1 = time = 0
waveform = square
time = 26

[State 168, Cancel]
type = varset
trigger1 = time = 0
var(2) = 1

[State 168, Pause]
type = pause
trigger1 = time = 0
time = 26;-1 * animelemtime(3)
endcmdbuftime = 26;-1 * animelemtime(3)

[State 168, Autocounter]
type = changestate
trigger1 = time = 1
value = 163

;---------------------------------------------------------------------------
; AGUARDHIT (shaking)
[Statedef 169]
type    = A
movetype= H
physics = N
velset = 0,0

[State 169, Remove]
type = removeexplod
trigger1 = !time
ID = 160
ignorehitpause = 1

[State 169, poweradd]
type = poweradd
trigger1 = !time
value = 210
persistent = 0

[State 169, spark]
type = helper
trigger1 = !time
name = "Spark"
ID = 10010
postype = p1
pos = const(size.mid.pos.x),const(size.mid.pos.y)
stateno = 10010
ownpal = 1
ignorehitpause = 1
pausemovetime = 999
persistent = 0

[State 169, 3]
type = ForceFeedback
trigger1 = time = 0
waveform = square
time = 26

[State 169, Cancel]
type = varset
trigger1 = time = 0
var(2) = 1

[State 169, Pause]
type = pause
trigger1 = time = 0
time = 26;-1 * animelemtime(3)
endcmdbuftime = 26;-1 * animelemtime(3)

[State 169, Autocounter]
type = changestate
trigger1 = time = 1
value = 163