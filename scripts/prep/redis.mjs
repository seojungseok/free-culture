export async function redis(command){
 const url=process.env.COUPANG_REDIS_REST_URL,token=process.env.COUPANG_REDIS_REST_TOKEN;
 if(!url||!token)throw Error('중앙 저장소 미연결: 상품 조회 대기');
 const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(10000),cache:'no-store'});
 if(!response.ok)throw Error('중앙 저장소 상태 확인 실패: 조회 대기');
 const data=await response.json();if(data.error)throw Error('중앙 저장소 명령 실패: 조회 대기');return data.result;
}
