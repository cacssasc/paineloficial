
    (function() {
      var preconnectOrigins = ["https://cdn.shopify.com"];
      var scripts = ["/cdn/shopifycloud/checkout-web/assets/c1/polyfills.Cm4XMvKf.js","/cdn/shopifycloud/checkout-web/assets/c1/app.b33qEv9W.js","/cdn/shopifycloud/checkout-web/assets/c1/2c1ab0fe.DYMrblOw.js","/cdn/shopifycloud/checkout-web/assets/c1/6a2fc6d6.DtbQ6zNZ.js","/cdn/shopifycloud/checkout-web/assets/c1/5587f402.DMJfWz4H.js","/cdn/shopifycloud/checkout-web/assets/c1/cf29e63b.BlbNmDwF.js","/cdn/shopifycloud/checkout-web/assets/c1/bfe75f31.Y7dJlI5j.js","/cdn/shopifycloud/checkout-web/assets/c1/8b3289d0.CwWaA10f.js","/cdn/shopifycloud/checkout-web/assets/c1/2255f8fa.BfBBftsb.js","/cdn/shopifycloud/checkout-web/assets/c1/204243fa.BE2giI6b.js","/cdn/shopifycloud/checkout-web/assets/c1/5c5817f3.1nvjwH8j.js","/cdn/shopifycloud/checkout-web/assets/c1/8f46f026.DUZahfka.js","/cdn/shopifycloud/checkout-web/assets/c1/f05935e5.BZsy9BPf.js","/cdn/shopifycloud/checkout-web/assets/c1/7336bdaf.CWCQy4ef.js","/cdn/shopifycloud/checkout-web/assets/c1/54c78614.vdz50MBF.js","/cdn/shopifycloud/checkout-web/assets/c1/6f2620f5.DyDBZCV6.js","/cdn/shopifycloud/checkout-web/assets/c1/b8733b27.DbsWRS1K.js","/cdn/shopifycloud/checkout-web/assets/c1/e39bc11c.0b2mxvY6.js","/cdn/shopifycloud/checkout-web/assets/c1/08a3b809.CzkZKTk-.js","/cdn/shopifycloud/checkout-web/assets/c1/164ad2e3.45RtIgD9.js","/cdn/shopifycloud/checkout-web/assets/c1/69fae6d4.B0cVlpvy.js","/cdn/shopifycloud/checkout-web/assets/c1/e12db40c.BZghZIYK.js","/cdn/shopifycloud/checkout-web/assets/c1/60a453ce.CpVJbaX2.js","/cdn/shopifycloud/checkout-web/assets/c1/f4abf1ad.C0oTlRcJ.js","/cdn/shopifycloud/checkout-web/assets/c1/f8706cb6.DAYdBJEV.js","/cdn/shopifycloud/checkout-web/assets/c1/0e9ee714.QAtkjlKy.js","/cdn/shopifycloud/checkout-web/assets/c1/39921a74.BCylixXG.js","/cdn/shopifycloud/checkout-web/assets/c1/7a8217fd.BXPFY0RF.js","/cdn/shopifycloud/checkout-web/assets/c1/8599b02a.DXAxYKIK.js","/cdn/shopifycloud/checkout-web/assets/c1/dffdfb34.CyX7UPn4.js","/cdn/shopifycloud/checkout-web/assets/c1/a422df8c.CqGrT8vh.js","/cdn/shopifycloud/checkout-web/assets/c1/efa0389a.DkPeBZq9.js","/cdn/shopifycloud/checkout-web/assets/c1/c8760fd8.BS0LvI4t.js","/cdn/shopifycloud/checkout-web/assets/c1/53bbdad9.DyI1VT0T.js","/cdn/shopifycloud/checkout-web/assets/c1/1f5e7811.BcQ-NBKv.js","/cdn/shopifycloud/checkout-web/assets/c1/1a6c2867.DIvU9A1-.js","/cdn/shopifycloud/checkout-web/assets/c1/2fdb3dd3.DUA7DB0a.js","/cdn/shopifycloud/checkout-web/assets/c1/22345fd4.BCbiU0hU.js","/cdn/shopifycloud/checkout-web/assets/c1/0e67bd3b.AXLsyE1b.js","/cdn/shopifycloud/checkout-web/assets/c1/a9fa9fda.DqZ7Jz62.js","/cdn/shopifycloud/checkout-web/assets/c1/ca3e798e.DUsTrXWN.js","/cdn/shopifycloud/checkout-web/assets/c1/f7861534.CbtzQqK0.js","/cdn/shopifycloud/checkout-web/assets/c1/47b970b2.B7Xxcp4V.js","/cdn/shopifycloud/checkout-web/assets/c1/064f6ac1.DwE5gVKF.js","/cdn/shopifycloud/checkout-web/assets/c1/17425706.k2ohhh4P.js","/cdn/shopifycloud/checkout-web/assets/c1/71ae3d5c.CjwusMM-.js","/cdn/shopifycloud/checkout-web/assets/c1/cb5cf153.B6Psj_x2.js","/cdn/shopifycloud/checkout-web/assets/c1/06ef5503.DOan0905.js","/cdn/shopifycloud/checkout-web/assets/c1/acc42fa8.C-gwuQb9.js","/cdn/shopifycloud/checkout-web/assets/c1/cccd6056.BTDMufzl.js","/cdn/shopifycloud/checkout-web/assets/c1/0b8657b8.CACgohIz.js","/cdn/shopifycloud/checkout-web/assets/c1/79974aab.DDiZ8OA2.js","/cdn/shopifycloud/checkout-web/assets/c1/89e2d30a.BQvCwOa6.js","/cdn/shopifycloud/checkout-web/assets/c1/ed9f2238.CUlBBMrb.js","/cdn/shopifycloud/checkout-web/assets/c1/6fb6f9d8.Wqbuu_sL.js","/cdn/shopifycloud/checkout-web/assets/c1/1444e6bd.BMzCn8V8.js","/cdn/shopifycloud/checkout-web/assets/c1/55098bf1.BBnAjXjP.js","/cdn/shopifycloud/checkout-web/assets/c1/f49d4216.C2pxczzP.js","/cdn/shopifycloud/checkout-web/assets/c1/7b0c98ea.CL7SEshG.js","/cdn/shopifycloud/checkout-web/assets/c1/d22d2b80.CksHwPG9.js","/cdn/shopifycloud/checkout-web/assets/c1/f58f39d8.ChQJIZ1c.js","/cdn/shopifycloud/checkout-web/assets/c1/e03065ab.ClV-bzPw.js","/cdn/shopifycloud/checkout-web/assets/c1/c09515bf.OJyWI8h1.js","/cdn/shopifycloud/checkout-web/assets/c1/6bfea526.CWyrgcoi.js","/cdn/shopifycloud/checkout-web/assets/c1/ac5a19ff.DJIIB3FF.js","/cdn/shopifycloud/checkout-web/assets/c1/598fef4e.CS4EWpTE.js","/cdn/shopifycloud/checkout-web/assets/c1/e77f7fe0.B-S-cT4v.js","/cdn/shopifycloud/checkout-web/assets/c1/cc6ff67d.Cr30PgCc.js","/cdn/shopifycloud/checkout-web/assets/c1/bf513f9c.BKj13KRv.js","/cdn/shopifycloud/checkout-web/assets/c1/dfca5da5.730UQoEr.js","/cdn/shopifycloud/checkout-web/assets/c1/dae24aab.DnlqPN9n.js","/cdn/shopifycloud/checkout-web/assets/c1/ddf59287.CNX7xTNn.js","/cdn/shopifycloud/checkout-web/assets/c1/01973ac7.BoPQBG71.js","/cdn/shopifycloud/checkout-web/assets/c1/58314944.BQRkZ-X1.js","/cdn/shopifycloud/checkout-web/assets/c1/945a08d6.DUImnspU.js","/cdn/shopifycloud/checkout-web/assets/c1/a25deb9a.D5J7aWEs.js","/cdn/shopifycloud/checkout-web/assets/c1/2b89a178.BBbP19hv.js","/cdn/shopifycloud/checkout-web/assets/c1/9068a4ed.BZCWJxbg.js","/cdn/shopifycloud/checkout-web/assets/c1/b684bff6.B9tpYG3w.js","/cdn/shopifycloud/checkout-web/assets/c1/f1968089.88Fnitma.js","/cdn/shopifycloud/checkout-web/assets/c1/910cd6e2.BsEPfn5v.js","/cdn/shopifycloud/checkout-web/assets/c1/347b440c.B0-IokYX.js","/cdn/shopifycloud/checkout-web/assets/c1/5ade1ef3.BBY1xXTB.js","/cdn/shopifycloud/checkout-web/assets/c1/181d38d3.CCJIfxNd.js","/cdn/shopifycloud/checkout-web/assets/c1/5a347040.CyIBx--Y.js","/cdn/shopifycloud/checkout-web/assets/c1/792bb671.ClPKyxwt.js","/cdn/shopifycloud/checkout-web/assets/c1/9ca7d819.BH4HgMg-.js","/cdn/shopifycloud/checkout-web/assets/c1/f51e663e.DocPcBC9.js","/cdn/shopifycloud/checkout-web/assets/c1/21cc90a2.DHzOO82q.js","/cdn/shopifycloud/checkout-web/assets/c1/64de7b49.DanIdenz.js","/cdn/shopifycloud/checkout-web/assets/c1/ca0c3e72.CVyMkLtv.js","/cdn/shopifycloud/checkout-web/assets/c1/8e79be58.D3C3edOg.js","/cdn/shopifycloud/checkout-web/assets/c1/90e26f5f.DgtwX1lk.js","/cdn/shopifycloud/checkout-web/assets/c1/31cc568e.95lmLO5k.js","/cdn/shopifycloud/checkout-web/assets/c1/65f3d4da.Bb3QiqCm.js","/cdn/shopifycloud/checkout-web/assets/c1/d5d34b3b.8Yco8vDL.js","/cdn/shopifycloud/checkout-web/assets/c1/ca5e9c49.CghJDcCI.js","/cdn/shopifycloud/checkout-web/assets/c1/f3e117aa.dWRue8YU.js","/cdn/shopifycloud/checkout-web/assets/c1/7aefefff.BnbtKFm0.js","/cdn/shopifycloud/checkout-web/assets/c1/b3389d5c.BoIU0CMu.js","/cdn/shopifycloud/checkout-web/assets/c1/73a9b0a0.E6Sns_9v.js","/cdn/shopifycloud/checkout-web/assets/c1/86720dbb.fE1z00J1.js","/cdn/shopifycloud/checkout-web/assets/c1/0724c71d.Bc8hH12L.js","/cdn/shopifycloud/checkout-web/assets/c1/7114e006.Sm4rIWNq.js","/cdn/shopifycloud/checkout-web/assets/c1/9babe369.YqtMchpc.js","/cdn/shopifycloud/checkout-web/assets/c1/434e3b0a.oup8Ur0H.js","/cdn/shopifycloud/checkout-web/assets/c1/e0989459.yvpkHWjM.js","/cdn/shopifycloud/checkout-web/assets/c1/cdfd59e6.DSK3D3S5.js","/cdn/shopifycloud/checkout-web/assets/c1/d2e6a587.hFkHc29m.js","/cdn/shopifycloud/checkout-web/assets/c1/ca3c8263.torN_x7M.js","/cdn/shopifycloud/checkout-web/assets/c1/083cdde5.Do04fAIS.js","/cdn/shopifycloud/checkout-web/assets/c1/fe885b80.DiFBZgie.js","/cdn/shopifycloud/checkout-web/assets/c1/f78726c8.B9I6beXK.js","/cdn/shopifycloud/checkout-web/assets/c1/d93ca466.7wxcvucY.js","/cdn/shopifycloud/checkout-web/assets/c1/e129c76e.Mh89x6oh.js","/cdn/shopifycloud/checkout-web/assets/c1/051149c8.lHD9iIAq.js","/cdn/shopifycloud/checkout-web/assets/c1/d7065744.DOl39X2x.js","/cdn/shopifycloud/checkout-web/assets/c1/7ee73f43.eFlPPMdV.js","/cdn/shopifycloud/checkout-web/assets/c1/0c0ad074.CXn5hbNW.js","/cdn/shopifycloud/checkout-web/assets/c1/8fe56fc9.dybPXE57.js","/cdn/shopifycloud/checkout-web/assets/c1/2210eadb.DF0gIp_2.js","/cdn/shopifycloud/checkout-web/assets/c1/8a00b682.ea82NLZz.js","/cdn/shopifycloud/checkout-web/assets/c1/87bfafec.CAdWUhIv.js","/cdn/shopifycloud/checkout-web/assets/c1/e477f96c.B7RRII2U.js","/cdn/shopifycloud/checkout-web/assets/c1/c6b02d73.C9SzqKC_.js","/cdn/shopifycloud/checkout-web/assets/c1/71b60e0a.Bdvld-6t.js","/cdn/shopifycloud/checkout-web/assets/c1/24773686.DwPqx3C1.js","/cdn/shopifycloud/checkout-web/assets/c1/7048f38b.BSelJUzs.js","/cdn/shopifycloud/checkout-web/assets/c1/c3c7c048.B9okDNQO.js","/cdn/shopifycloud/checkout-web/assets/c1/7aa3b627.BEYHB57_.js","/cdn/shopifycloud/checkout-web/assets/c1/dada7e07.BTQkpsm0.js","/cdn/shopifycloud/checkout-web/assets/c1/c10167e6.MbLmHg0s.js","/cdn/shopifycloud/checkout-web/assets/c1/17e57de1.B-aJsvl7.js"];
      var styles = ["/cdn/shopifycloud/checkout-web/assets/c1/assets/app.DBH01810.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/is-address-empty.DDArxpAV.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/hydrate.BR4wlDB-.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/OnePage.C_uC3EPz.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/StickyPayButton.D-gNjNDa.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Switch.BS8yVgoP.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useShopPayProgressIntercepts.CIy8uDiZ.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/VatNumberValidationField.DZtuG_UK.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/EmptyState.BEvzDDvy.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Choice.BMdzfW_y.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ShopPayLogo.87JMHPUK.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ChangeCompanyLocationLink.B1YSPUDc.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PhoneField.uZEuHncj.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Popover.Bi1nHaU-.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/index.Du9dByaI.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useApplePayButtonStatus.ct4xfivv.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/TransitionHeight.CuRoM9zv.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Tipping.BcTJoNaV.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PaymentIcon.gzvCNwz_.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PaymentLine.DT05kVlY.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Section.CU18S7Ap.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/findSelectedDeliveryMethod.xO_7ctnq.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Middot.D7Ujmshx.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/EstimatedDeliveryContent.BAjucZ-8.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/BrandedPromise.B0RErzdh.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ShippingMethods.DU0m5rdF.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/ShippingMethodSelector.B0hio2RO.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/SubscriptionPriceBreakdown.vTcdVGq4.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/BelowTheFoldContent.DRJckcGa.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/RememberMeSection.JBO5WNhc.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PaymentMethodProgressionHost.kQR0txJ7.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/RedirectionNotice.B8v_QGNW.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/MissingFields.BbxB_6wt.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/MobileOrderSummary.CyQZvZOO.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useOnePageFormSubmit.1WzRSowg.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/checkout-pay-button-exit.KhTiKgPS.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/observe-fit-scale.DpLOWYa8.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useShopPayButtonClassName.btyKOfco.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Payment.DrWvAMMF.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PaymentOptionSelector.s-Kd_X2E.css"];
      var fontPreconnectUrls = [];
      var fontPrefetchUrls = [];
      var imgPrefetchUrls = [];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = preconnectOrigins.concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  