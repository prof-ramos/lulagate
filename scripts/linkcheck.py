import json,subprocess,csv,time
S=json.load(open('data/sources.json'))
UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36'
def c(u,head):
    a=['curl','-s','-o','/dev/null','-L','--max-time','15','-A',UA,'-w','%{http_code} %{url_effective}']
    if head:a.append('-I')
    r=subprocess.run(a+[u],capture_output=True,text=True)
    p=r.stdout.split(' ',1);return p[0],(p[1] if len(p)>1 else ''),r.returncode
w=csv.writer(open('data/link-check.csv','w'));w.writerow(['id','url','head','get','final_url','curl_exit','result'])
for s in S:
    h,_,_=c(s['url'],True);time.sleep(0.5)
    g,f,rc=c(s['url'],False);time.sleep(0.5)
    res='ok' if g.startswith(('2','3')) or h.startswith('2') else ('dead' if g in('404','410') or g=='000' else 'blocked')
    w.writerow([s['id'],s['url'],h,g,f,rc,res]);print(s['id'],h,g,res,flush=True)
