import { Profile } from "../models/profile";
import { ProfileWorld, ScoreWorld, EventWorld, GhostWorld, RivalWorld } from "../models/ddrworld";
import { SONGS_WORLD, SONGS_OVERRIDE_WORLD, EVENTS_WORLD } from "../data/world";

// needs to be faster
function getLastGhostId(ghost: any) {
  return ghost.reduce(function(a, b) {
    let aId = (a && !a.ghostId) ? 0 : a.ghostId
    let bId = (!b.ghostId) ? 0 : b.ghostId
    return (a && aId > bId) ? aId : bId
  })
}

async function saveScores(refid: string, songId: number, style: number, difficulty: number, rank: number, clearKind: number, score: number, exScore: number, maxCombo: number, flareForce: number, ghostSize: number, ghost: string) {
  let ghostData = await DB.Find<GhostWorld>(null, {collection: "ghost3"})
  let lastGhostId = getLastGhostId(ghostData)
  let stepScore = await DB.FindOne<ScoreWorld>(refid, {collection: "score3", songId: songId, style: style, difficulty: difficulty})
  let ghostId = 0
  if(lastGhostId === 0) {
    ghostId = 1
  } else ghostId = lastGhostId += 1
  /*
    Ghost data gets created when there is no existing data and it gets updated when getting a higher or the same score
    Side effect of this is when you have set a high score prior to this update, the ghost data wouldn't be updated unless you break or match that high score.
    Unfortunately I could not find a way to match the old scores to their respective ghost data, since the old ghost data only stored the song id and difficulty, and not the style (single/double.) Stupid me.
    Still needs more work.
  */
  if(stepScore) {
    ghostId = (stepScore.ghostId) ? stepScore.ghostId : ghostId
    let stepGhost = await DB.FindOne<GhostWorld>(null, {collection: "ghost3", ghostId: ghostId })
    if(stepGhost) {
      if(score >= stepScore.score) console.log("overwriting ghostdata")
      ghostSize = (score >= stepScore.score) ? ghostSize : stepGhost.ghostSize
      ghost = (score >= stepScore.score) ? ghost : stepGhost.ghost
    }

    rank = (rank < stepScore.rank) ? rank : stepScore.rank;
    clearKind = (clearKind != 6 && clearKind > stepScore.clearKind) ? clearKind : stepScore.clearKind;
    score = (score > stepScore.score) ? score : stepScore.score;
    exScore = (exScore > stepScore.exScore) ? exScore : stepScore.exScore;
    maxCombo = (maxCombo > stepScore.maxCombo) ? maxCombo : stepScore.maxCombo;
    flareForce = (flareForce > stepScore.flareForce) ? flareForce : stepScore.flareForce;

  }

  await DB.Upsert<ScoreWorld>(refid, {
    collection: "score3",
    songId,
    style,
    difficulty
    }, {
      $set: {
        ghostId,
        rank,
        clearKind,
        score,
        exScore,
        maxCombo,
        flareForce
      }
  });

  console.log("saving ghostid: " + ghostId)
  await DB.Upsert<GhostWorld>(refid, {
    collection: "ghost3",
    ghostId,
    }, {
      $set: {
        ghostSize,
        ghost
      }
  });
}

// async function addGhostId(refid: string) {
//   const ghost = await DB.Find<GhostWorld>(null, { collection: "ghost3" });
//   if(ghost) {
//     let lastGhostId = getLastScoreId(ghost)
//     if(lastGhostId === 0) {
//       console.log("Modifying score data to add ghost id.")
//       for(const scoreData of scores) {
//         let songId = scoreData.songId
//         let style = scoreData.style
//         let difficulty = scoreData.difficulty
//         let rank = scoreData.rank
//         let clearKind = scoreData.clearKind
//         let score = scoreData.score
//         let exScore = scoreData.exScore
//         let maxCombo = scoreData.maxCombo
//         let flareForce = scoreData.flareForce
//         let ghostSize = (scoreData.ghostSize) ? scoreData.ghostSize : 0
//         let ghost = (scoreData.ghost) ? scoreData.ghost : '0'
//         await DB.Remove<ScoreWorld>(refid, {collection: "score3", songId: songId, style: style, difficulty: difficulty})
//         await saveScores(refid, songId, style, difficulty, rank, clearKind, score, exScore, maxCombo, flareForce, ghostSize, ghost)
//       }
//     }
//   }
// }

export const playerdatanew: EPR = async (info, data, send) => {
  const refid = $(data).str("data.refid");
  let ddrCode = _.random(1, 99999999)
  await DB.Upsert<ProfileWorld>(refid, { collection: "profile3" }, {
    collection: "profile3",
    ddrCode: ddrCode
  })
  return send.object({
    result: K.ITEM("s32", 0),
    refid: K.ITEM("str", refid),
    ddrcode: K.ITEM("s32", ddrCode),
    istakeover: K.ITEM('bool', false)
  })
}

export const playerdatasave: EPR = async (info, data, send) => {
  const refid = $(data).str("data.refid");
  if(!refid.startsWith("X000")) {
    if($(data).number("data.savekind") === 1) {
      await DB.Upsert<ProfileWorld>(refid, { collection: "profile3" }, {
        collection: "profile3",
        
        ddrCode: $(data).number('data.common.ddrcode'),
        dancerName: $(data).str('data.common.dancername'),
        area: $(data).number('data.common.area'),
        extraStar: $(data).number('data.common.extrastar'),
        playCount: 0,
        weight: 0,
        todayCal: $(data).number('data.common.today_cal'),
        isDispWeight: true,
        prePlayableNum: 0,

        opHispeed: $(data).number('data.option.hispeed'),
        opGauge: $(data).number('data.option.gauge'),
        opFastSlow: $(data).number('data.option.fastslow'),
        opGuideline: $(data).number('data.option.guideline'),
        opStepZone: $(data).number('data.option.stepzone'),
        opTimingDisp: $(data).number('data.option.timing_disp'),
        opVisibility: $(data).number('data.option.visibility'),
        opVisibleTime: $(data).number('data.option.visible_time'),
        opLane: $(data).number('data.option.lane'),
        opLaneHiddenPos: $(data).number('data.option.lane_hiddenpos'),
        opLaneSuddenPos: $(data).number('data.option.lane_suddenpos'),
        opLaneHidSudPos: $(data).number('data.option.lane_hidsudpos'),
        opLaneFilter: $(data).number('data.option.lane_filter'),
        opScrollDirection: $(data).number('data.option.scroll_direction'),
        opScrollMoving: $(data).number('data.option.scroll_moving'),
        opArrowPriority: $(data).number('data.option.arrow_priority'),
        opArrowPlacement: $(data).number('data.option.arrow_placement'),
        opArrowColor: $(data).number('data.option.arrow_color'),
        opArrowDesign: $(data).number('data.option.arrow_design'),
        opCutTiming: $(data).number('data.option.cut_timing'),
        opCutFreeze: $(data).number('data.option.cut_freeze'),
        opCutJump: $(data).number('data.option.cut_jump'),
        
        lpMode: $(data).number('data.lastplay.mode'),
        lpFolder: $(data).number('data.lastplay.folder'),
        lpMcode: $(data).number('data.lastplay.mcode'),
        lpStyle: $(data).number('data.lastplay.style'),
        lpDifficulty: $(data).number('data.lastplay.difficulty'),
        lpWindowMain: $(data).number('data.lastplay.window_main'),
        lpWindowSub: $(data).number('data.lastplay.window_sub'),
        lpTarget: $(data).number('data.lastplay.target'),
        lpTabMain: $(data).number('data.lastplay.tab_main'),
        lpTabSub: $(data).number('data.lastplay.tab_sub'),
        
        fsTitle: $(data).number('data.filtersort.title'),
        fsVersion: $(data).number('data.filtersort.version'),
        fsGenre: $(data).number('data.filtersort.genre'),
        fsBpm: $(data).number('data.filtersort.bpm'),
        fsEvent: $(data).number('data.filtersort.event'),
        fsLevel: $(data).number('data.filtersort.level'),
        fsFlareRank: $(data).number('data.filtersort.flare_rank'),
        fsClearRank: $(data).number('data.filtersort.clear_rank'),
        fsFlareSkillTarget: $(data).number('data.filtersort.flare_skill_target'),
        fsRivalFlareSkill: $(data).number('data.filtersort.rival_flare_skill'),
        fsRivalScoreRank: $(data).number('data.filtersort.rival_score_rank'),
        fsSortType: $(data).number('data.filtersort.sort_type'),
        fsOrderType: $(data).number('data.filtersort.order_type'),
        
        cgTipsBasic: $(data).number('data.checkguide.tips_basic'),
        cgTipsOption: $(data).number('data.checkguide.tips_option'),
        cgTipsEvent: $(data).number('data.checkguide.tips_event'),
        cgTipsGimmick: $(data).number('data.checkguide.tips_gimmick'),
        cgTipsAdvance: $(data).number('data.checkguide.tips_advance'),
        cgGuideScene: $(data).number('data.checkguide.guide_scene')
      })
    }
    else if($(data).number("data.savekind") === 2) {
      let songId = $(data).number("data.result.mcode");
      let style = $(data).number("data.result.style");
      let difficulty = $(data).number("data.result.difficulty");
      let rank = $(data).number("data.result.rank");
      let clearKind = $(data).number("data.result.clearkind");
      let score = $(data).number("data.result.score");
      let exScore = $(data).number("data.result.exscore");
      let maxCombo = $(data).number("data.result.maxcombo");
      let flareForce = $(data).number("data.result.flare_force");
      let ghostSize = $(data).number("data.result.ghostsize");
      let ghost = $(data).str("data.result.ghost");
      await saveScores(refid, songId, style, difficulty, rank, clearKind, score, exScore, maxCombo, flareForce, ghostSize, ghost)
    }
    else if($(data).number("data.savekind") === 3) {
      let profile = await DB.FindOne<ProfileWorld>(refid, {collection: "profile3"})
      await DB.Upsert<ProfileWorld>(refid, { collection: "profile3" }, {
        collection: "profile3",
        
        ddrCode: $(data).number('data.common.ddrcode'),
        dancerName: $(data).str('data.common.dancername'),
        area: $(data).number('data.common.area'),
        extraStar: $(data).number('data.common.extrastar'),
        playCount: profile.playCount += 1,
        weight: 0,
        todayCal: $(data).number('data.common.today_cal'),
        isDispWeight: true,
        prePlayableNum: 0,

        opHispeed: $(data).number('data.option.hispeed'),
        opGauge: $(data).number('data.option.gauge'),
        opFastSlow: $(data).number('data.option.fastslow'),
        opGuideline: $(data).number('data.option.guideline'),
        opStepZone: $(data).number('data.option.stepzone'),
        opTimingDisp: $(data).number('data.option.timing_disp'),
        opVisibility: $(data).number('data.option.visibility'),
        opVisibleTime: $(data).number('data.option.visible_time'),
        opLane: $(data).number('data.option.lane'),
        opLaneHiddenPos: $(data).number('data.option.lane_hiddenpos'),
        opLaneSuddenPos: $(data).number('data.option.lane_suddenpos'),
        opLaneHidSudPos: $(data).number('data.option.lane_hidsudpos'),
        opLaneFilter: $(data).number('data.option.lane_filter'),
        opScrollDirection: $(data).number('data.option.scroll_direction'),
        opScrollMoving: $(data).number('data.option.scroll_moving'),
        opArrowPriority: $(data).number('data.option.arrow_priority'),
        opArrowPlacement: $(data).number('data.option.arrow_placement'),
        opArrowColor: $(data).number('data.option.arrow_color'),
        opArrowDesign: $(data).number('data.option.arrow_design'),
        opCutTiming: $(data).number('data.option.cut_timing'),
        opCutFreeze: $(data).number('data.option.cut_freeze'),
        opCutJump: $(data).number('data.option.cut_jump'),
        
        lpMode: $(data).number('data.lastplay.mode'),
        lpFolder: $(data).number('data.lastplay.folder'),
        lpMcode: $(data).number('data.lastplay.mcode'),
        lpStyle: $(data).number('data.lastplay.style'),
        lpDifficulty: $(data).number('data.lastplay.difficulty'),
        lpWindowMain: $(data).number('data.lastplay.window_main'),
        lpWindowSub: $(data).number('data.lastplay.window_sub'),
        lpTarget: $(data).number('data.lastplay.target'),
        lpTabMain: $(data).number('data.lastplay.tab_main'),
        lpTabSub: $(data).number('data.lastplay.tab_sub'),
        
        fsTitle: $(data).number('data.filtersort.title'),
        fsVersion: $(data).number('data.filtersort.version'),
        fsGenre: $(data).number('data.filtersort.genre'),
        fsBpm: $(data).number('data.filtersort.bpm'),
        fsEvent: $(data).number('data.filtersort.event'),
        fsLevel: $(data).number('data.filtersort.level'),
        fsFlareRank: $(data).number('data.filtersort.flare_rank'),
        fsClearRank: $(data).number('data.filtersort.clear_rank'),
        fsFlareSkillTarget: $(data).number('data.filtersort.flare_skill_target'),
        fsRivalFlareSkill: $(data).number('data.filtersort.rival_flare_skill'),
        fsRivalScoreRank: $(data).number('data.filtersort.rival_score_rank'),
        fsSortType: $(data).number('data.filtersort.sort_type'),
        fsOrderType: $(data).number('data.filtersort.order_type'),
        
        cgTipsBasic: $(data).number('data.checkguide.tips_basic'),
        cgTipsOption: $(data).number('data.checkguide.tips_option'),
        cgTipsEvent: $(data).number('data.checkguide.tips_event'),
        cgTipsGimmick: $(data).number('data.checkguide.tips_gimmick'),
        cgTipsAdvance: $(data).number('data.checkguide.tips_advance'),
        cgGuideScene: $(data).number('data.checkguide.guide_scene')
      })

      let eventData = $(data).elements('data.event')
      if(eventData) {
        for(const e of eventData) {
          let eid = e.number('eventid')
          let eno = e.number('eventno')
          let etype = e.number('eventtype')
          let ctime = e.number('comptime')
          let sdata = e.number('savedata')

          await DB.Upsert<EventWorld>(refid, { collection: "event3", eventId: eid, eventNo: eno, eventType: etype }, {
            collection: "event3", 
            eventId: eid, 
            eventNo: eno, 
            eventType: etype, 
            compTime: ctime, 
            saveData: sdata 
          })
        }
      }
    }

    return send.object({
      result: K.ITEM("s32", 0)
    })
  }

  return send.object({
    result: K.ITEM("s32", 1)
  })
};

export const playerdataload: EPR = async (info, data, send) => {
  const refid = $(data).str("data.refid");
  const profile = await DB.FindOne<ProfileWorld>(refid, { collection: "profile3" });

  if (!profile || !profile.dancerName || refid.startsWith("X000"))  {
    return send.object({
      result: K.ITEM("s32", 0),
      refid: K.ITEM("str", refid),
      gamesession: K.ITEM('s64', BigInt(1)),
      servertime: K.ITEM("u64", BigInt(getDate())),
      is_locked: K.ITEM('bool', false),
      common: {
        ddrcode: K.ITEM("s32", profile ? profile.ddrCode : 0),
        dancername: K.ITEM("str", ''),
        is_new: K.ITEM('bool', (!profile || refid.startsWith("X000")) ? true : false),
        is_registering: K.ITEM('bool', (profile && !profile.dancerName) ? true : false),
        is_takeover: K.ITEM('bool', false),
        area: K.ITEM("s32", 0),
        extrastar: K.ITEM("s32", 0),
        playcount: K.ITEM("s32", 0),
        weight: K.ITEM("s32", 0),
        today_cal: K.ITEM("u64", BigInt(0)),
        is_disp_weight: K.ITEM("bool", false),
        pre_playable_num: K.ITEM("s32", 0)
      },
      option: {
        hispeed: K.ITEM("s32", 0),
        gauge: K.ITEM("s32", 0),
        fastslow: K.ITEM("s32", 0),
        guideline: K.ITEM("s32", 0),
        stepzone: K.ITEM("s32", 0),
        timing_disp: K.ITEM("s32", 0),
        visibility: K.ITEM("s32", 0),
        visible_time: K.ITEM("s32", 0),
        lane: K.ITEM("s32", 0),
        lane_hiddenpos: K.ITEM("s32", 0),
        lane_suddenpos: K.ITEM("s32", 0),
        lane_hidsudpos: K.ITEM("s32", 0),
        lane_filter: K.ITEM("s32", 0),
        scroll_direction: K.ITEM("s32", 0),
        scroll_moving: K.ITEM("s32", 0),
        arrow_priority: K.ITEM("s32", 0),
        arrow_placement: K.ITEM("s32", 0),
        arrow_color: K.ITEM("s32", 0),
        arrow_design: K.ITEM("s32", 0),
        cut_timing: K.ITEM("s32", 0),
        cut_freeze: K.ITEM("s32", 0),
        cut_jump: K.ITEM("s32", 0)
      },
      lastplay: {
        mode: K.ITEM("s32", 0),
        folder: K.ITEM("s32", 0),
        mcode: K.ITEM("s32", 0),
        style: K.ITEM("s32", 0),
        difficulty: K.ITEM("s32", 0),
        window_main: K.ITEM("s32", 0),
        window_sub: K.ITEM("s32", 0),
        target: K.ITEM("s32", 0),
        tab_main: K.ITEM("s32", 0),
        tab_sub: K.ITEM("s32", 0)
      },
      filtersort: {
        title: K.ITEM("u64", BigInt(0)),
        version: K.ITEM("u64", BigInt(0)),
        genre: K.ITEM("u64", BigInt(0)),
        bpm: K.ITEM("u64", BigInt(0)),
        event: K.ITEM("u64", BigInt(0)),
        level: K.ITEM("u64", BigInt(0)),
        flare_rank: K.ITEM("u64", BigInt(0)),
        clear_rank: K.ITEM("u64", BigInt(0)),
        flare_skill_target: K.ITEM("u64", BigInt(0)),
        rival_flare_skill: K.ITEM("u64", BigInt(0)),
        rival_score_rank: K.ITEM("u64", BigInt(0)),
        sort_type: K.ITEM("u64", BigInt(0)),
        order_type: K.ITEM("s32", 0),
      },
      checkguide: {
        tips_basic: K.ITEM("u64", BigInt(0)),
        tips_option: K.ITEM("u64", BigInt(0)),
        tips_event: K.ITEM("u64", BigInt(0)),
        tips_gimmick: K.ITEM("u64", BigInt(0)),
        tips_advance: K.ITEM("u64", BigInt(0)),
        guide_scene: K.ITEM("u64", BigInt(0)),
      },
      rival: [
        {
          slot: K.ITEM("s32", 0),
          rivalcode: K.ITEM("s32", 0)
        }
      ],
      score: [
        {
          mcode: K.ITEM("s32", 0),
          score_single: {
            score_str: K.ITEM("str", "")
          },
          score_double: {
            score_str: K.ITEM("str", "")
          }
        }
      ],
      event: {
        event_str: K.ITEM("str", "")
      }
    })
  }
  else {
    // await addGhostId(refid)
    const scores = await DB.Find<ScoreWorld>(refid, { collection: "score3" });
    let scoreFin = []
    if(scores) {
      for(const scoreData of scores) {
        let mcodeIndex = scoreFin.findIndex(x => $(x).number('mcode') === scoreData.songId)
        if(mcodeIndex < 0) {
          let scr = {}
          scr['mcode'] = K.ITEM('s32', scoreData.songId)
          scr['score_single'] = []
          scr['score_double'] = []
          /*
            difficulty,idk,grade,clearkind,score,idk either,flaredisp,flarepoints
            needs more work, 9 vals
          */
          scr[(scoreData.style === 0) ? 'score_single' : 'score_double'] = [
            {
              score_str: K.ITEM('str', scoreData.difficulty + ',1,' + scoreData.rank + ',' + scoreData.clearKind + ',' + scoreData.score + ',' + scoreData.ghostId + ',' + (scoreData.flareForce ? scoreData.flareForce : '-1') + ',' + (scoreData.flareForce ? scoreData.flareForce : '-1'))
            }
          ]
          scoreFin.push(scr)
          
        } else {
          scoreFin[mcodeIndex][(scoreData.style === 0) ? 'score_single' : 'score_double'].push({
            score_str: K.ITEM('str', scoreData.difficulty + ',1,' + scoreData.rank + ',' + scoreData.clearKind + ',' + scoreData.score + ',' + scoreData.ghostId + ',' + (scoreData.flareForce ? scoreData.flareForce : '-1') + ',' + (scoreData.flareForce ? scoreData.flareForce : '-1'))
          })
        }
      }
    }

    let eventFin = []
    let eventData = await DB.Find<EventWorld>(refid, { collection: "event3"});
    for(const event of EVENTS_WORLD) {
      let eData = eventData.find(e => e.eventId === event.id)
      let condmet = true
      if(event.dep) {
        event.dep.forEach(dep => {
          let eData = eventData.find(e => e.eventId === dep)
          if(eData === undefined) condmet = false
          else if(eData.compTime === 0) condmet = false
        })
      }
      // id,type,no,condition,reward,comptime,savedata
      if(condmet) {
        if(event.type === 17) {
          if (eData) eData.compTime = eData.compTime ? 0 : 1 
          event.comp = event.comp ? 0 : 1
        }
        eventFin.push({
          event_str: K.ITEM('str', event.id + ',' + event.type + ',' + event.no + ',' + event.cond + ',' + event.rwrd + ',' + (eData ? BigInt(eData.compTime) : (event.comp !== undefined ? event.comp : '0')) + ',' + ((eData) ? eData.saveData : ((event.save !== undefined) ? event.save : '0')))
        })  
      }
    }

    // test
    if(IO.Exists('data/test.json')) {
      let bufTest = await IO.ReadFile('data/test.json')
      let eventTest = JSON.parse(bufTest.toString())
      for(const ex in eventTest['eventtest']) {
        eventFin.push({ event_str: K.ITEM('str', eventTest['eventtest'][ex]) })
      }
    }

    return send.object({
      result: K.ITEM("s32", 0),
      refid: K.ITEM("str", refid),
      gamesession: K.ITEM('s64', BigInt(1)),
      servertime: K.ITEM("u64", BigInt(getDate())),
      is_locked: K.ITEM('bool', false),
      common: {
        ddrcode: K.ITEM("s32", profile.ddrCode),
        dancername: K.ITEM("str", profile.dancerName),
        is_new: K.ITEM('bool', false),
        is_registering: K.ITEM('bool', false),
        is_takeover: K.ITEM('bool', false),
        area: K.ITEM("s32", profile.area),
        extrastar: K.ITEM("s32", profile.extraStar),
        playcount: K.ITEM("s32", profile.playCount),
        weight: K.ITEM("s32", profile.weight),
        today_cal: K.ITEM("u64", BigInt(profile.todayCal)),
        is_disp_weight: K.ITEM("bool", profile.isDispWeight),
        pre_playable_num: K.ITEM("s32", profile.prePlayableNum)
      },
      option: {
        hispeed: K.ITEM("s32", profile.opHispeed),
        gauge: K.ITEM("s32", profile.opGauge),
        fastslow: K.ITEM("s32", profile.opFastSlow),
        guideline: K.ITEM("s32", profile.opGuideline),
        stepzone: K.ITEM("s32", profile.opStepZone),
        timing_disp: K.ITEM("s32", profile.opTimingDisp),
        visibility: K.ITEM("s32", profile.opVisibility),
        visible_time: K.ITEM("s32", profile.opVisibleTime),
        lane: K.ITEM("s32", profile.opLane),
        lane_hiddenpos: K.ITEM("s32", profile.opLaneHiddenPos),
        lane_suddenpos: K.ITEM("s32", profile.opLaneSuddenPos),
        lane_hidsudpos: K.ITEM("s32", profile.opLaneHidSudPos),
        lane_filter: K.ITEM("s32", profile.opLaneFilter),
        scroll_direction: K.ITEM("s32", profile.opScrollDirection),
        scroll_moving: K.ITEM("s32", profile.opScrollMoving),
        arrow_priority: K.ITEM("s32", profile.opArrowPriority),
        arrow_placement: K.ITEM("s32", profile.opArrowPlacement),
        arrow_color: K.ITEM("s32", profile.opArrowColor),
        arrow_design: K.ITEM("s32", profile.opArrowDesign),
        cut_timing: K.ITEM("s32", profile.opCutTiming),
        cut_freeze: K.ITEM("s32", profile.opCutFreeze),
        cut_jump: K.ITEM("s32", profile.opCutJump)
      },
      lastplay: {
        mode: K.ITEM("s32", profile.lpMode),
        folder: K.ITEM("s32", profile.lpFolder),
        mcode: K.ITEM("s32", profile.lpMcode),
        style: K.ITEM("s32", profile.lpStyle),
        difficulty: K.ITEM("s32", profile.lpDifficulty),
        window_main: K.ITEM("s32", profile.lpWindowMain),
        window_sub: K.ITEM("s32", profile.lpWindowSub),
        target: K.ITEM("s32", profile.lpTarget),
        tab_main: K.ITEM("s32", profile.lpTabMain),
        tab_sub: K.ITEM("s32", profile.lpTabSub)
      },
      filtersort: {
        title: K.ITEM("u64", BigInt(profile.fsTitle)),
        version: K.ITEM("u64", BigInt(profile.fsVersion)),
        genre: K.ITEM("u64", BigInt(profile.fsGenre)),
        bpm: K.ITEM("u64", BigInt(profile.fsBpm)),
        event: K.ITEM("u64", BigInt(profile.fsEvent)),
        level: K.ITEM("u64", BigInt(profile.fsLevel)),
        flare_rank: K.ITEM("u64", BigInt(profile.fsFlareRank)),
        clear_rank: K.ITEM("u64", BigInt(profile.fsClearRank)),
        flare_skill_target: K.ITEM("u64", BigInt(profile.fsFlareSkillTarget)),
        rival_flare_skill: K.ITEM("u64", BigInt(profile.fsRivalFlareSkill)),
        rival_score_rank: K.ITEM("u64", BigInt(profile.fsRivalScoreRank)),
        sort_type: K.ITEM("u64", BigInt(profile.fsSortType)),
        order_type: K.ITEM("s32", profile.fsOrderType),
      },
      checkguide: {
        tips_basic: K.ITEM("u64", BigInt(profile.cgTipsBasic)),
        tips_option: K.ITEM("u64", BigInt(profile.cgTipsOption)),
        tips_event: K.ITEM("u64", BigInt(profile.cgTipsEvent)),
        tips_gimmick: K.ITEM("u64", BigInt(profile.cgTipsGimmick)),
        tips_advance: K.ITEM("u64", BigInt(profile.cgTipsAdvance)),
        guide_scene: K.ITEM("u64", BigInt(profile.cgGuideScene)),
      },
      rival: [],
      score: scoreFin,
      event: eventFin
    });
  }
};

export const musicdataload: EPR = async (info, data, send) => {
  // I personally use the last A3 db for this, will check for missing songs
  let musicList = []
  if(IO.Exists('data/musicdb.xml')) { 
    let mdb = U.parseXML(U.DecodeString(await IO.ReadFile('data/musicdb.xml'), "shift_jis"), false)
    for(const music of mdb['mdb']['music']) {
      let difficultyArr = $(music).numbers('diffLv')
      let limited = ($(music).number('limited')) ? $(music).number('limited') : 0
      let limitedAry = ($(music).numbers('limited_ary')) ? $(music).numbers('limited_ary') : []

      let overrideIndex = SONGS_OVERRIDE_WORLD.findIndex(s => s.mcode === $(music).number('mcode'))
      if(overrideIndex > -1) {
        limitedAry = (SONGS_OVERRIDE_WORLD[overrideIndex]['limited_ary'] !== [] ? SONGS_OVERRIDE_WORLD[overrideIndex]['limited_ary'] : limitedAry)
        difficultyArr = SONGS_OVERRIDE_WORLD[overrideIndex]['diffLv']
      }

      for(const [index, diff] of difficultyArr.entries()) {
        limited = (limitedAry) ? limitedAry[index] : limited
        limited = ((index % 5 === 4) && $(music).number('limited_cha')) ? $(music).number('limited_cha') : limited
        musicList.push({
          music_str: K.ITEM('str', $(music).number('mcode') + ',' + ((index > 4) ? '1,' : '0,') + (index % 5) + ',' + limited + ',' + diff)
        })
      }
    }
  }


  for(const music of SONGS_WORLD) {
    for(const [index, diff] of music.diffLv.entries()) {
      if(music.limited_ary[index] != -1) {
        musicList.push({
          music_str: K.ITEM('str', music.mcode + ',' + ((index > 4) ? '1,' : '0,') + (index % 5) + ',' + music.limited_ary[index] + ',' + diff)
        })
      }
    }
  }
  // test
  if(IO.Exists('data/test.json')) {
    let bufTest = await IO.ReadFile('data/test.json')
    let eventTest = JSON.parse(bufTest.toString())
    for(const ex in eventTest['songstest']) {
      for(const [index, diff] of eventTest['songstest'][ex].diffLv.entries()) {
        if(eventTest['songstest'][ex].limited_ary[index] != -1) {
          musicList.push({
            music_str: K.ITEM('str', eventTest['songstest'][ex].mcode + ',' + ((index > 4) ? '1,' : '0,') + (index % 5) + ',' + eventTest['songstest'][ex].limited_ary[index] + ',' + diff)
          })
        }
      }
    }
  }

  return send.object({
    result: K.ITEM("s32", 0),
    servertime: K.ITEM("u64", BigInt(getDate())),
    music: musicList
  });
};

export const rivaldataload: EPR = async (info, data, send) => {
  return send.object({
    result: K.ITEM("s32", 0),
    record: []
  });
};

export const ghostdataload: EPR = async (info, data, send) => {
  // Choosing world, area and machine #1 target scores doesn't seem to call this endpoint yet (or at all)
  const refid = $(data).str("data.refid");
  const ghostId = $(data).number("data.ghostid");
  console.log("loading ghostid: " + ghostId)
  let ghostData = await DB.FindOne<GhostWorld>(null, {collection: 'ghost3', ghostId: ghostId})
  if(ghostData) {
    return send.object({
      result: K.ITEM("s32", 0),
      ghostsize: K.ITEM("s32", ghostData.ghostSize),
      ghost: K.ITEM("str", ghostData.ghost)
    });
  }
  return send.object({ result: K.ITEM("s32", 0) });
};

export const taboowordcheck: EPR = async (info, data, send) => {
  // Automatically accept word
  return send.object({
    result: K.ITEM("s32", 0),
    is_taboo: K.ITEM("bool", false)
  });
};

export const minidump: EPR = async (info, data, send) => {
  return send.object({ result: K.ITEM('s32', 0) })
};

function getDate(): number {
  let time = new Date();
  let tempDate = time.getDate();
  const currentTime = parseInt((time.getTime()/100000) as unknown as string)*100;
  return currentTime
}
