defmodule StexTest.Diff do
  use ExUnit.Case
  doctest Stex

  defmodule Struct do
    defstruct [:name, :age]
  end

  test "diff binary" do
    assert [%{a: "u", p: [], t: "b"}] = Stex.Diff.check("a", "b")
  end

  test "diff tuple" do
    assert [%{a: "u", p: [], t: :b}] = Stex.Diff.check(:a, :b)
  end

  test "diff integer" do
    assert [%{a: "u", p: [], t: 2}] = Stex.Diff.check(1, 2)
  end

  test "diff float" do
    assert [%{a: "u", p: [], t: 1.1}] = Stex.Diff.check(1, 1.1)
  end

  test "diff boolean" do
    assert [%{a: "u", p: [], t: true}] = Stex.Diff.check(false, true)
  end

  test "diff list" do
    assert [%{a: "i", p: [2], t: 3}, %{a: "d", p: [1, 1]}, %{a: "u", p: [0], t: 2}] = Stex.Diff.check([1, [1, 2]], [2, [1], 3])
  end

  test "diff map" do
    assert [%{a: "i", p: [:c], t: "c"}, %{a: "d", p: [:b]}, %{a: "u", p: [:a], t: 1}] = Stex.Diff.check(%{a: "a", b: "b"}, %{a: 1, c: "c"})
  end

  test "diff struct" do
    assert [%{a: "i", p: [:age], t: 10}, %{a: "u", p: [:name], t: "B"}] = Stex.Diff.check(%{name: "A"}, %{name: "B", age: 10})
  end
end