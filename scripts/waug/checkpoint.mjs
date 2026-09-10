if(process.env.WAUG_SERVER_EXECUTION!=='1')throw Error('예약 서버 전용');
const r=await fetch('http://127.0.0.1:47831/checkpoint',{method:'POST',signal:AbortSignal.timeout(120000)});
if(!r.ok)throw Error('원격 체크포인트 저장 실패 HTTP '+r.status);console.log(await r.text());
