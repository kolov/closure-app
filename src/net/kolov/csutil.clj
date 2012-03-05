(ns net.kolov.csutil)

(defmacro defelement[name id] `(def ~name (dom/getElement ~id)))