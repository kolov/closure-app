(ns net.kolov.jacla.search
  (:require [goog.net :as net]
            [goog.dom :as dom]
            [clojure.browser.repl :as repl]
            [goog.events :as events]
            [goog.ui.tree.TreeControl :as tree]
            [goog.ui.Component :as component]
            [clojure.string :as str])
  (:require-macros [net.kolov.csutil :as csutil])
  (:use [jayq.core :only [$ css inner]])
  )

; see how to config this
;(repl/connect "http://localhost:9000/repl")


(def jquery (js* "$"))

(defn json-generate
  "Returns a newline-terminate JSON string from the given
   ClojureScript data."
  [data]
  (str (JSON/stringify (clj->js data)) "\n"))

(defn json-parse
  "Returns ClojureScript data from a JSON string."
  [line]
  (js->clj (JSON/parse line)))


(csutil/defelement search-input "searchInput")
(csutil/defelement search-status "searchStatus")
(csutil/defelement classes-tree "classes-tree")
(csutil/defelement libs-tree "libs-tree")
(csutil/defelement libs-head "libs-head")
(csutil/defelement classes-head "classes-head")

(defn query-update [q f]
  "Query q and execute f on completion"
  (let [x (net/XhrIo.)]
    (events/listen x (.-COMPLETE goog.net.EventType) #(f x))
    (.send x q)))

(def dom_ (dom/DomHelper.))
(defn append-div [parent clazz content]
  (dom/appendChild parent (dom/createDom "div" {"class" clazz} content)))

(defn set-div-text [d t]
  (.removeChildren dom_ d)
  (append-div d "title" t)
  )

(defn set-status [t] (set-div-text search-status t))
(defn set-classes-head [t] (set-div-text classes-head t))
(defn set-libs-head [t] (set-div-text libs-head t))

(defn classname [c] (str (c "packageName") "." (c "className")))
(defn libname [l] (str (l "packageId") ":" (l "artifactId")))
(defn libid [l] (str (l "repoType") "/" (l "repoId") "/" (libname l)))

(def tree-config tree/defaultConfig)
(set! (.-cleardotPath tree-config) "/closure-library/closure/goog/images/tree/cleardot.gif")

(defn make-lib-query-string [libnode]
  (-> (str "/list/" (.getId libnode))
    (str/replace ":" "/")
    (str/replace "." "/")))

(defn make-class-query-string [classnode]
  (str "/searchFamilies?class=" (.getHtml classnode) )
  )
(defn make-fam-query-string [node]
  (str "/searchLibs?" (.getId node) "&class="(.getHtml (.getParent node))))

(defn make-lib-html [v]
  (if (v "source")
    (str "<a href=\"#\">"  (v "source") "</a>")
    (str "<span class=\"small\">no source</span>")))

(defn make-family-name [f]
  (if (nil? ( f "artifactId"))
  "JDK"
  (str (f "packageId" ) ":" (f "artifactId"))))
(defn make-family-html [f] "_")
(defn make-family-id [f]
  (str "repoType=" (f "repoType") "&repoId=" (f "repoId")
  (if (nil? ( f "artifactId"))
    ""
    (str "&packageId=" (f "packageId") "&artifactId=" (f "artifactId")))) )

(defn create-tree-node [id txt parent]
  (let [node (.createNode (.getTree parent) txt)]
    (.setHtml node txt)
    (.setId node id)
    (.add parent node)
    (.setExpanded node false)
    (.add node (.createNode (.getTree node) "Loading...")) node))

(defn libnode-click-handler [node]
  (query-update
    (make-lib-query-string node)
    (fn [x] (let [resp (.getResponse x)
                  v (json-parse resp)
                  versions (v "versions")]
              (.removeChildren node)
              (doseq [version versions]
                (let [v-string (version "version")
                      newNode (.createNode (.getTree node) v-string)]
                  (.setAfterLabelHtml newNode (make-lib-html version))
                  (.add node newNode)))))))


(defn class-node-click-handler [node]
  (query-update
    (make-class-query-string node)
    (fn [x] (let [resp (.getResponse x)
                  families (json-parse resp)
                  ]
              (.removeChildren node)
              (doseq [family families]
                (let [fname (make-family-name family)
                      newNode (create-tree-node (make-family-id family) (make-family-name family) node)]

                  (events/listenOnce (.getElement newNode) (.-CLICK events/EventType) #(famnode-click-handler newNode))
                  )))))
  )

(defn famnode-click-handler [node]
  (query-update
    (make-fam-query-string node)
    (fn [x] (let [resp (.getResponse x)
                  libraries (json-parse resp)
                  ]
              (.removeChildren node)
              (doseq [library libraries]
                (let [
                      newNode (.createNode (.getTree node) (library "version"))]
                  (.setAfterLabelHtml newNode "hehe")
                  (.add node newNode)))))))

(defn make-lib-tree [libs]
  (let [treeControl (goog.ui.tree.TreeControl. "root" tree-config)]
    (.removeChildren dom_ libs-tree)
    (doseq [lib libs] (create-tree-node (libid lib) (libname lib) treeControl))
    (.render treeControl libs-tree)
    (.setShowRootNode treeControl false)
    (doseq [node (.getChildren treeControl)]
      (events/listenOnce (.getElement node) (.-CLICK events/EventType) #(libnode-click-handler node)))
    ))

(defn make-classes-tree [classes]
  (let [treeControl (goog.ui.tree.TreeControl. "root" tree-config)]
    (.removeChildren dom_ classes-tree)
    (doseq [class classes] (create-tree-node (str "cls/" (classname class)) (classname class) treeControl))
    (.render treeControl classes-tree)
    (.setShowRootNode treeControl false)
    (doseq [node (.getChildren treeControl)]
      (events/listenOnce (.getElement node) (.-CLICK events/EventType) #(class-node-click-handler node)))
    ))

(defn update-result [x]
  (let [resp (.getResponse x)
        v (json-parse resp)
        totalClasses (v "totalClasses")
        classes (v "classes")
        totalLibs (v "totalLibs")
        libs (v "libs")]

    (set-classes-head (str "Found " totalClasses " classes"
                        (if (not (= (count classes) totalClasses)) (str " showing first " (count classes)))))
    (make-classes-tree classes)
    (set-libs-head (str "Found " totalLibs " libs"
                     (if (not (= (count libs) totalLibs)) (str " showing first " (count libs)))))
    (make-lib-tree libs)
    ))



(defn query [t]
  (set-status "Searching...")
  (query-update (str "/search?token=" t) update-result)
   (set-status "")
  )

(events/listen search-input (.-KEYUP events/EventType)
  (fn []
    (let [txt (.-value search-input)]
      (if (> (count txt) 1)
        (query txt)
        (set-status "Type at least 2 characters")))))

(defn ^:export initSearchPage [] (js/alert (str search-input)))
