import re


class PrereqNode:
    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right


def tokenize(expression):
    pattern = r'\(|\)|AND|OR|[A-Z]{2,5}\s\d{3,5}'
    tokens = re.findall(pattern, expression)
    return [token.strip() for token in tokens]


def parse_expression(tokens):
    def parse_factor():
        if not tokens:
            return None

        token = tokens.pop(0)

        if token == "(":
            node = parse_or()
            if tokens and tokens[0] == ")":
                tokens.pop(0)
            return node

        return PrereqNode(token)

    def parse_and():
        node = parse_factor()

        while tokens and tokens[0] == "AND":
            op = tokens.pop(0)
            right = parse_factor()
            node = PrereqNode(op, left=node, right=right)

        return node

    def parse_or():
        node = parse_and()

        while tokens and tokens[0] == "OR":
            op = tokens.pop(0)
            right = parse_and()
            node = PrereqNode(op, left=node, right=right)

        return node

    return parse_or()


def build_prereq_tree(expression):
    tokens = tokenize(expression)
    return parse_expression(tokens)