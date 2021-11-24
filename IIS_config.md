## IIS 設定`web.config`

* 為了對應:
	* service worker跨域載入圖片被content-security-policy擋下
		* 針對service worker設定`content-security-policy: connect-src *;`
	* chrome新版快取策略造成更新靜態資源時仍使用舊的列表
		* 針對service worker跟資源列表設定`Cache-Control: public, no-cache, max-age=0, must-revalidate`
		* 針對/設定`Cache-Control: public, no-cache, max-age=0, must-revalidate`
* 加入下面這段:
	* `sw.js` 為service worker的檔名
	* `sw-manifest.js` 為靜態資源列表的檔名
	* `/`、`/index.html` 對應到編譯後的`index.html`

```
<configuration>
	<rewrite>
		<outboundRules>
			<rule name="Set sw.js HTTP response header" enabled="true" stopProcessing="false">
				<match serverVariable="RESPONSE_content_security_policy" pattern=".*" />
				<conditions>
					<add input="{REQUEST_URI}" pattern="sw\.js$" />
				</conditions>
				<action type="Rewrite" value="connect-src *;" />
			</rule>
			<rule name="forec-check sw.js" enabled="true" stopProcessing="false">
				<match serverVariable="RESPONSE_Cache_Control" pattern=".*" />
				<conditions>
					<add input="{REQUEST_URI}" pattern="sw\.js$" />
				</conditions>
				<action type="Rewrite" value="public, no-cache, max-age=0, must-revalidate" />
			</rule>
			<rule name="forec-check sw-manifest.js" enabled="true" stopProcessing="false">
				<match serverVariable="RESPONSE_Cache_Control" pattern=".*" />
				<conditions>
					<add input="{REQUEST_URI}" pattern="sw-manifest\.js$" />
				</conditions>
				<action type="Rewrite" value="public, no-cache, max-age=0, must-revalidate" />
			</rule>
			<rule name="forec-check index.html" enabled="true" stopProcessing="false">
				<match serverVariable="RESPONSE_Cache_Control" pattern=".*" />
				<conditions logicalGrouping="MatchAny">
					<add input="{PATH_INFO}" pattern="/$" />
					<add input="{PATH_INFO}" pattern="/index\.html$" />
				</conditions>
				<action type="Rewrite" value="public, no-cache, max-age=0, must-revalidate" />
			</rule>
		</outboundRules>
	</rewrite>
</configuration>
```

* ref:
	* https://docs.microsoft.com/en-us/iis/extensions/url-rewrite-module/url-rewrite-module-configuration-reference#accessing-url-parts-from-a-rewrite-rule
		* `{REQUEST_URI}`的意義跟底下的IIS變數不符
	* https://docs.microsoft.com/en-us/iis/web-dev-reference/server-variables

### youtube player (iframe)

* 調整CSP header (`content-security-policy`):
	* `frame-src 'self' https://www.youtube-nocookie.com/`

### 其它外部引用資源相關
* Google 翻譯
	* https://translate.googleapis.com
* Google GA 儀表板
	* https://datastudio.google.com/
* Google GA
	* https://www.google-analytics.com/	
* Windy 切換
	* https://embed.windy.com/
	
```
<configuration>
	<system.webServer>
		<httpProtocol>
			<customHeaders>
			<!-- 清除既有的 Headers -->
				<clear />			
			<!-- access-control-allow-origin -->
				<add name="access-control-allow-origin" value="https://ocean.taiwan.gov.tw/" />
			<!-- X-Frame-Options 綁架攻擊 -->
				<add name="X-Frame-Options" value="SAMEORIGIN" />
			<!-- X-XSS-Protection XSS 攻擊 和 Content-Security-Policy 雷同，主要用於保護力不夠的瀏覽器-->
				<add name="X-XSS-Protection" value="1; mode=block" />
			<!-- Referrer-Policy 增加隱私權 -->
				<add name="Referrer-Policy" value="strict-origin" />
			<!-- X-Content-Type-Options 避免錯誤的 Content type -->
				<add name="X-Content-Type-Options" value="nosniff" />
			<!-- Feature-Policy 避免錯誤的 Content type -->
			<!-- <add name="Feature-Policy" value="vibrate 'self'; usermedia *; sync-xhr 'self' https://ocean.taiwan.gov.tw" /> -->
				<add name="Feature-Policy" value="vibrate 'self'; sync-xhr 'self' https://ocean.taiwan.gov.tw" />
			<!-- Content-Security-Policy XSS 攻擊-->
				<add name="Content-Security-Policy" value="   frame-ancestors 'self' ;           default-src 'self' 'unsafe-inline'                      https://www.google.com/      https://embed.windy.com/;              font-src 'self' data:                      https://js.arcgis.com            https://cdn.jsdelivr.net/                 https://fonts.gstatic.com/      https://rocean.oac.gov.tw/;              style-src 'self' 'unsafe-inline'                      https://js.arcgis.com       https://rocean.oac.gov.tw/            https://cdn.jsdelivr.net/                https://fonts.googleapis.com  https://translate.googleapis.com;              img-src * data:                      ;              script-src 'self' 'unsafe-inline' 'unsafe-eval'                      https://www.googletagmanager.com      https://www.google-analytics.com      https://cdn.polyfill.io/ https://polyfill.io/      https://fonts.googleapis.com      https://js.arcgis.com/                            https://cdnjs.cloudflare.com/                      https://maps.googleapis.com/                      https://ajax.googleapis.com/                      https://www.google.com/                      https://www.gstatic.com/                      https://code.jquery.com/                      https://code.highcharts.com/                      https://ocean.taiwan.gov.tw/      https://rocean.oac.gov.tw/  https://translate.google.com  https://translate.googleapis.com https://*.googleapis.com;               connect-src 'self' https://stats.g.doubleclick.net/         https://www.leica.com.tw/            https://ocean.taiwan.gov.tw/      https://rocean.oac.gov.tw/ https://wmts.nlsc.gov.tw/ https://gis.sinica.edu.tw/worldmap/file-exists.php https://www.google-analytics.com/ https://translate.googleapis.com/ ; frame-src 'self' https://www.youtube-nocookie.com/ https://datastudio.google.com/ https://embed.windy.com/ " />
			</customHeaders>
		</httpProtocol>


		<security>
		<!-- 關閉 IIS OPTIONS 的方法 -->
		<requestFiltering>
			<verbs>
			<remove verb="OPTIONS" />
			<add verb="OPTIONS" allowed="false" />
			</verbs>
		</requestFiltering>
		</security>
		<rewrite>
			<rules>
			<rule name="HTTP to HTTPS redirect" stopProcessing="true">
				<match url="(.*)" />
				<conditions>
				<add input="{HTTPS}" pattern="off" ignoreCase="true" />
				</conditions>
				<action type="Redirect" redirectType="Found" url="https://{HTTP_HOST}/{R:1}" />
			</rule>
			</rules>
			<outboundRules>
				<rule name="Remove Server">
					<match serverVariable="RESPONSE_SERVER" pattern=".*" />
					<action type="Rewrite" />
				</rule>
				<rule name="Add Strict-Transport-Security when HTTPS" enabled="true">
					<match serverVariable="RESPONSE_Strict_Transport_Security" pattern=".*" />
					<conditions>
						<add input="{HTTPS}" pattern="on" ignoreCase="true" />
					</conditions>
					<action type="Rewrite" value="max-age=31536000;includeSubDomains;preload" />
				</rule>
				<rule name="SW.js" enabled="true" stopProcessing="false">
					<match customTags="" serverVariable="RESPONSE_content_security_policy" pattern=".*" />
					<conditions>
						<add input="{REQUEST_URI}" pattern="sw\.js$" />
					</conditions>
					<action type="Rewrite" value="connect-src *;" />
				</rule>
				<rule name="forec-check sw.js" enabled="true" stopProcessing="false">
					<match serverVariable="RESPONSE_Cache_Control" pattern=".*" />
					<conditions>
						<add input="{REQUEST_URI}" pattern="sw\.js$" />
					</conditions>
					<action type="Rewrite" value="public, no-cache, max-age=0, must-revalidate" />
				</rule>
				<rule name="forec-check sw-manifest.js" enabled="true" stopProcessing="false">
					<match serverVariable="RESPONSE_Cache_Control" pattern=".*" />
					<conditions>
						<add input="{REQUEST_URI}" pattern="sw-manifest\.js$" />
					</conditions>
					<action type="Rewrite" value="public, no-cache, max-age=0, must-revalidate" />
				</rule>
			</outboundRules>
		</rewrite>
        <staticContent>
            <clientCache cacheControlMode="DisableCache" />
        </staticContent>

	</system.webServer>
</configuration>
```

