import { Broc, Egg, Garlic, Tomato } from "./Ingredients";

export function HappyWok() {
  return (
    <div className="wok-thumb" aria-hidden="true">
    <div className="wok-wrap">
      <div className="steam s1" />
      <div className="steam s2" />
      <div className="steam s3" />

      <div className="toss toss1">
        <Broc />
      </div>
      <div className="toss toss2">
        <Tomato />
      </div>
      <div className="toss toss3">
        <Egg />
      </div>
      <div className="toss toss4">
        <Garlic />
      </div>

      <div className="wok">
        <div className="wok-handle" />
        <div className="wok-body">
          <div className="wok-shine" />
          <div className="wok-face">
            <div className="eye left">
              <span />
            </div>
            <div className="eye right">
              <span />
            </div>
            <div className="blush bl" />
            <div className="blush br" />
            <div className="smile" />
          </div>
        </div>
      </div>

      <div className="flames">
        <div className="flame f1" />
        <div className="flame f2" />
        <div className="flame f3" />
      </div>
    </div>
    </div>
  );
}
