type Clr = { type: "color", data: string; };
type Var = { type: "variable", data: string; };
type Fn = {
	type: "function", data: {
		function: string;
		param: string;
		amount: number;
	};
};
type ColorTuple = [number, number, number];