type Int = number;
type Float = number;
type Grid = Array<Array<Float>>;
type Fn = (i: Int, j: Int) => Float;
type HelperKeys = "u" | "v" | "dudx" | "dudy" | "d2udx2" | "d2udy2";
type Helper = Record<HelperKeys, Fn>;
type UserFn = (i: Int, j: Int, helper: Helper) => Float;
